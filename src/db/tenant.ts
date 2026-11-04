/**
 * Tenant-аар шүүсэн query-ууд. Байгууллагын өгөгдлийг ЗӨВХӨН эндээс уншина —
 * ингэснээр нэг байгууллага нөгөөгийнхөө өгөгдлийг санамсаргүй харах эрсдэлгүй.
 */
import { and, asc, eq, gte, inArray, isNull, lt, ne, or, sql } from "drizzle-orm";
import { db, schema } from "./index";

const { tenants, services, staff, staffServices, schedules, timeOff, bookings, resources, customers, notifications } = schema;

type BookingStatus = (typeof schema.bookingStatusEnum.enumValues)[number];

export async function getTenantBySlug(slug: string) {
  const [t] = await db()
    .select()
    .from(tenants)
    .where(and(eq(tenants.slug, slug), eq(tenants.status, "active")))
    .limit(1);
  return t ?? null;
}

export async function listServices(tenantId: string) {
  return db()
    .select()
    .from(services)
    .where(and(eq(services.tenantId, tenantId), eq(services.active, true)))
    .orderBy(asc(services.sortOrder), asc(services.name));
}

export async function listStaffForService(tenantId: string, serviceId: string) {
  return db()
    .select({ id: staff.id, name: staff.name, title: staff.title })
    .from(staff)
    .innerJoin(staffServices, eq(staffServices.staffId, staff.id))
    .where(and(eq(staff.tenantId, tenantId), eq(staff.active, true), eq(staffServices.serviceId, serviceId)))
    .orderBy(asc(staff.sortOrder), asc(staff.name));
}

export async function listResources(tenantId: string) {
  return db()
    .select({ id: resources.id, name: resources.name })
    .from(resources)
    .where(and(eq(resources.tenantId, tenantId), eq(resources.active, true)))
    .orderBy(asc(resources.sortOrder));
}

/** Тухайн өдрийн сул цаг тооцоход хэрэгтэй бүх өгөгдлийг нэг дор татна. */
export async function loadAvailabilityInputs(params: {
  tenantId: string;
  ownerIds: string[];
  ownerKind: "staff" | "resource";
  weekday: number;
  dayStartUtc: Date;
  dayEndUtc: Date;
  /** Цаг шилжүүлэхэд тухайн захиалгыг өөрийг нь завгүйд тооцохгүй */
  excludeBookingId?: string;
}) {
  const { tenantId, ownerIds, ownerKind, weekday, dayStartUtc, dayEndUtc, excludeBookingId } = params;
  if (ownerIds.length === 0) return { schedules: [], timeOff: [], bookings: [] };

  const schedOwner = ownerKind === "staff" ? schedules.staffId : schedules.resourceId;
  const offOwner = ownerKind === "staff" ? timeOff.staffId : timeOff.resourceId;
  const bookOwner = ownerKind === "staff" ? bookings.staffId : bookings.resourceId;

  const [sch, off, bk] = await Promise.all([
    db()
      .select()
      .from(schedules)
      .where(and(eq(schedules.tenantId, tenantId), inArray(schedOwner, ownerIds), eq(schedules.weekday, weekday))),
    db()
      .select()
      .from(timeOff)
      .where(
        and(
          eq(timeOff.tenantId, tenantId),
          // Тухайн ажилтны чөлөө, эсвэл бүх байгууллагын амралт (хэнд ч оноогоогүй)
          or(inArray(offOwner, ownerIds), and(isNull(timeOff.staffId), isNull(timeOff.resourceId))),
          lt(timeOff.startsAt, dayEndUtc),
          gte(timeOff.endsAt, dayStartUtc),
        ),
      ),
    db()
      .select({ staffId: bookings.staffId, resourceId: bookings.resourceId, startsAt: bookings.startsAt, endsAt: bookings.endsAt })
      .from(bookings)
      .where(
        and(
          eq(bookings.tenantId, tenantId),
          inArray(bookOwner, ownerIds),
          inArray(bookings.status, ["pending", "confirmed", "checked_in"]),
          lt(bookings.startsAt, dayEndUtc),
          gte(bookings.endsAt, dayStartUtc),
          excludeBookingId ? ne(bookings.id, excludeBookingId) : undefined,
        ),
      ),
  ]);
  return { schedules: sch, timeOff: off, bookings: bk };
}

// ── Ажилтны самбар ─────────────────────────────────────────────────────────

export async function getService(tenantId: string, serviceId: string) {
  const [s] = await db()
    .select()
    .from(services)
    .where(and(eq(services.id, serviceId), eq(services.tenantId, tenantId)))
    .limit(1);
  return s ?? null;
}

/** Календарийн багана: ажилтан эсвэл нөөц (bookingMode-оос хамаарна) */
export async function listOwners(tenantId: string, kind: "staff" | "resource") {
  if (kind === "resource") return listResources(tenantId);
  return db()
    .select({ id: staff.id, name: staff.name })
    .from(staff)
    .where(and(eq(staff.tenantId, tenantId), eq(staff.active, true)))
    .orderBy(asc(staff.sortOrder), asc(staff.name));
}

export async function listSchedulesForWeekday(tenantId: string, weekday: number) {
  return db()
    .select({ staffId: schedules.staffId, resourceId: schedules.resourceId, startMin: schedules.startMin, endMin: schedules.endMin })
    .from(schedules)
    .where(and(eq(schedules.tenantId, tenantId), eq(schedules.weekday, weekday)));
}

const bookingView = {
  id: bookings.id,
  startsAt: bookings.startsAt,
  endsAt: bookings.endsAt,
  status: bookings.status,
  source: bookings.source,
  staffId: bookings.staffId,
  resourceId: bookings.resourceId,
  answers: bookings.answers,
  notes: bookings.notes,
  serviceId: services.id,
  serviceName: services.name,
  durationMin: services.durationMin,
  customerId: customers.id,
  customerName: customers.name,
  customerPhone: customers.phone,
  noShowCount: customers.noShowCount,
};

export type BookingView = Awaited<ReturnType<typeof listBookingsInRange>>[number];

/** Хугацааны хүрээн дэх захиалгууд (цуцлагдсаныг оруулахгүй) */
export async function listBookingsInRange(tenantId: string, fromUtc: Date, toUtc: Date) {
  return db()
    .select(bookingView)
    .from(bookings)
    .innerJoin(services, eq(services.id, bookings.serviceId))
    .innerJoin(customers, eq(customers.id, bookings.customerId))
    .where(
      and(
        eq(bookings.tenantId, tenantId),
        ne(bookings.status, "cancelled"),
        lt(bookings.startsAt, toUtc),
        gte(bookings.endsAt, fromUtc),
      ),
    )
    .orderBy(asc(bookings.startsAt));
}

/** Батлах хүлээж буй ирээдүйн захиалгууд */
export async function listPendingBookings(tenantId: string, now = new Date()) {
  return db()
    .select(bookingView)
    .from(bookings)
    .innerJoin(services, eq(services.id, bookings.serviceId))
    .innerJoin(customers, eq(customers.id, bookings.customerId))
    .where(and(eq(bookings.tenantId, tenantId), eq(bookings.status, "pending"), gte(bookings.startsAt, now)))
    .orderBy(asc(bookings.startsAt))
    .limit(100);
}

export async function getBooking(tenantId: string, bookingId: string) {
  const [b] = await db()
    .select()
    .from(bookings)
    .where(and(eq(bookings.id, bookingId), eq(bookings.tenantId, tenantId)))
    .limit(1);
  return b ?? null;
}

/**
 * Төлөв солих. `from` өгвөл зөвхөн тэр төлөвөөс шилжинэ (зэрэг товшилтоос хамгаална).
 * Шинэчлэгдсэн мөрийг буцаана, тохирохгүй бол null.
 */
export async function updateBookingStatus(
  tenantId: string,
  bookingId: string,
  to: BookingStatus,
  opts: { from?: BookingStatus[]; cancelledBy?: "customer" | "staff" } = {},
) {
  const [b] = await db()
    .update(bookings)
    .set({ status: to, cancelledBy: to === "cancelled" ? (opts.cancelledBy ?? "staff") : null })
    .where(
      and(
        eq(bookings.id, bookingId),
        eq(bookings.tenantId, tenantId),
        opts.from ? inArray(bookings.status, opts.from) : undefined,
      ),
    )
    .returning();
  return b ?? null;
}

export async function moveBooking(
  tenantId: string,
  bookingId: string,
  p: { startsAt: Date; endsAt: Date; staffId: string | null; resourceId: string | null; status: BookingStatus },
) {
  const [b] = await db()
    .update(bookings)
    .set(p)
    .where(and(eq(bookings.id, bookingId), eq(bookings.tenantId, tenantId)))
    .returning();
  return b ?? null;
}

export async function incrementNoShow(tenantId: string, customerId: string, delta: 1 | -1) {
  await db()
    .update(customers)
    .set({ noShowCount: sql`greatest(${customers.noShowCount} + ${delta}, 0)` })
    .where(and(eq(customers.id, customerId), eq(customers.tenantId, tenantId)));
}

/** Харилцагч: (tenant, утас)-аар давтагдахгүй, нэрийг шинэчилнэ */
export async function upsertCustomer(tenantId: string, name: string, phone: string) {
  const [c] = await db()
    .insert(customers)
    .values({ tenantId, name, phone })
    .onConflictDoUpdate({ target: [customers.tenantId, customers.phone], set: { name: sql`excluded.name` } })
    .returning();
  return c;
}

export async function getCustomer(tenantId: string, customerId: string) {
  const [c] = await db()
    .select()
    .from(customers)
    .where(and(eq(customers.id, customerId), eq(customers.tenantId, tenantId)))
    .limit(1);
  return c ?? null;
}

/** Захиалгын хуваарьт мэдэгдлүүдийг цуцлана (захиалга цуцлагдсан/шилжсэн үед) */
export async function cancelScheduledNotifications(tenantId: string, bookingId: string) {
  // notifications-д tenant_id байхгүй тул захиалга энэ tenant-ынх эсэхийг subquery-ээр баталгаажуулна
  await db()
    .update(notifications)
    .set({ status: "cancelled" })
    .where(
      and(
        eq(notifications.bookingId, bookingId),
        eq(notifications.status, "scheduled"),
        inArray(
          notifications.bookingId,
          db().select({ id: bookings.id }).from(bookings).where(and(eq(bookings.id, bookingId), eq(bookings.tenantId, tenantId))),
        ),
      ),
    );
}

// ── Бүртгэл ба тохиргоо ────────────────────────────────────────────────────

export type SetupService = { name: string; durationMin: number; bufferMin: number; price: number | null };
export type ScheduleRow = { weekday: number; startMin: number; endMin: number };

export async function isSlugTaken(slug: string) {
  const [r] = await db().select({ id: tenants.id }).from(tenants).where(eq(tenants.slug, slug)).limit(1);
  return !!r;
}

/**
 * Байгууллага + эзэмшигч + үйлчилгээ + ажилтан/нөөц + ажлын цагийг нэг транзакцаар үүсгэнэ.
 * Ажилтан бүр бүх үйлчилгээг хийнэ (дараа тохиргооноос өөрчилнө).
 */
export async function insertTenantSetup(p: {
  tenant: typeof tenants.$inferInsert;
  ownerUserId: string;
  services: SetupService[];
  owners: string[];
  schedule: ScheduleRow[];
}) {
  return db().transaction(async (tx) => {
    const [t] = await tx.insert(tenants).values(p.tenant).returning();
    await tx.insert(schema.memberships).values({ userId: p.ownerUserId, tenantId: t.id, role: "owner" });

    const svc = p.services.length
      ? await tx
          .insert(services)
          .values(p.services.map((s, i) => ({ tenantId: t.id, ...s, sortOrder: i })))
          .returning({ id: services.id })
      : [];

    const isResource = t.bookingMode === "resource";
    for (const [i, name] of p.owners.entries()) {
      let ownerId: string;
      if (isResource) {
        const [r] = await tx.insert(resources).values({ tenantId: t.id, type: "bay", name, sortOrder: i }).returning();
        ownerId = r.id;
      } else {
        const [s] = await tx.insert(staff).values({ tenantId: t.id, name, sortOrder: i }).returning();
        ownerId = s.id;
        if (svc.length) await tx.insert(staffServices).values(svc.map((x) => ({ staffId: s.id, serviceId: x.id })));
      }
      if (p.schedule.length) {
        await tx.insert(schedules).values(
          p.schedule.map((w) => ({
            tenantId: t.id,
            staffId: isResource ? null : ownerId,
            resourceId: isResource ? ownerId : null,
            ...w,
          })),
        );
      }
    }
    return t;
  });
}

export async function updateTenantInfo(
  tenantId: string,
  p: Partial<Pick<typeof tenants.$inferInsert, "name" | "address" | "phone" | "timezone" | "settings">>,
) {
  const [t] = await db().update(tenants).set(p).where(eq(tenants.id, tenantId)).returning();
  return t ?? null;
}

/** Тохиргооны хуудсанд: идэвхгүйг ч оруулна */
export async function listAllServices(tenantId: string) {
  return db().select().from(services).where(eq(services.tenantId, tenantId)).orderBy(asc(services.sortOrder), asc(services.name));
}

export async function listAllOwners(tenantId: string, kind: "staff" | "resource") {
  if (kind === "resource") {
    return db()
      .select({ id: resources.id, name: resources.name, active: resources.active, title: sql<string | null>`null` })
      .from(resources)
      .where(eq(resources.tenantId, tenantId))
      .orderBy(asc(resources.sortOrder));
  }
  return db()
    .select({ id: staff.id, name: staff.name, active: staff.active, title: staff.title })
    .from(staff)
    .where(eq(staff.tenantId, tenantId))
    .orderBy(asc(staff.sortOrder), asc(staff.name));
}

export async function listTenantSchedules(tenantId: string) {
  return db()
    .select({ staffId: schedules.staffId, resourceId: schedules.resourceId, weekday: schedules.weekday, startMin: schedules.startMin, endMin: schedules.endMin })
    .from(schedules)
    .where(eq(schedules.tenantId, tenantId));
}

export async function upsertService(tenantId: string, p: SetupService & { id?: string; active: boolean }) {
  if (p.id) {
    const [s] = await db()
      .update(services)
      .set({ name: p.name, durationMin: p.durationMin, bufferMin: p.bufferMin, price: p.price, active: p.active })
      .where(and(eq(services.id, p.id), eq(services.tenantId, tenantId)))
      .returning();
    return s ?? null;
  }
  return db().transaction(async (tx) => {
    const [{ n }] = await tx.select({ n: sql<number>`count(*)::int` }).from(services).where(eq(services.tenantId, tenantId));
    const [s] = await tx
      .insert(services)
      .values({ tenantId, name: p.name, durationMin: p.durationMin, bufferMin: p.bufferMin, price: p.price, active: p.active, sortOrder: n })
      .returning();
    // Шинэ үйлчилгээг бүх идэвхтэй ажилтанд онооно
    const st = await tx.select({ id: staff.id }).from(staff).where(eq(staff.tenantId, tenantId));
    if (st.length) await tx.insert(staffServices).values(st.map((x) => ({ staffId: x.id, serviceId: s.id })));
    return s;
  });
}

/** Ажилтан/бокс нэмэх эсвэл засах. Шинэ бол бүх үйлчилгээ + байгууллагын ердийн цагийг онооно. */
export async function upsertOwner(
  tenantId: string,
  kind: "staff" | "resource",
  p: { id?: string; name: string; title?: string | null; active: boolean },
  defaultSchedule: ScheduleRow[],
) {
  if (p.id) {
    if (kind === "resource") {
      const [r] = await db()
        .update(resources)
        .set({ name: p.name, active: p.active })
        .where(and(eq(resources.id, p.id), eq(resources.tenantId, tenantId)))
        .returning();
      return r ?? null;
    }
    const [s] = await db()
      .update(staff)
      .set({ name: p.name, title: p.title ?? null, active: p.active })
      .where(and(eq(staff.id, p.id), eq(staff.tenantId, tenantId)))
      .returning();
    return s ?? null;
  }
  return db().transaction(async (tx) => {
    let ownerId: string;
    if (kind === "resource") {
      const [{ n }] = await tx.select({ n: sql<number>`count(*)::int` }).from(resources).where(eq(resources.tenantId, tenantId));
      const [r] = await tx.insert(resources).values({ tenantId, type: "bay", name: p.name, active: p.active, sortOrder: n }).returning();
      ownerId = r.id;
    } else {
      const [{ n }] = await tx.select({ n: sql<number>`count(*)::int` }).from(staff).where(eq(staff.tenantId, tenantId));
      const [s] = await tx.insert(staff).values({ tenantId, name: p.name, title: p.title ?? null, active: p.active, sortOrder: n }).returning();
      ownerId = s.id;
      const svc = await tx.select({ id: services.id }).from(services).where(eq(services.tenantId, tenantId));
      if (svc.length) await tx.insert(staffServices).values(svc.map((x) => ({ staffId: s.id, serviceId: x.id })));
    }
    if (defaultSchedule.length) {
      await tx.insert(schedules).values(
        defaultSchedule.map((w) => ({
          tenantId,
          staffId: kind === "staff" ? ownerId : null,
          resourceId: kind === "resource" ? ownerId : null,
          ...w,
        })),
      );
    }
    return { id: ownerId };
  });
}

/** Бүх ажилтан/боксын долоо хоногийн цагийг нэг дор солино */
export async function replaceAllSchedules(tenantId: string, kind: "staff" | "resource", schedule: ScheduleRow[]) {
  await db().transaction(async (tx) => {
    await tx.delete(schedules).where(eq(schedules.tenantId, tenantId));
    const owners =
      kind === "resource"
        ? await tx.select({ id: resources.id }).from(resources).where(eq(resources.tenantId, tenantId))
        : await tx.select({ id: staff.id }).from(staff).where(eq(staff.tenantId, tenantId));
    const rows = owners.flatMap((o) =>
      schedule.map((w) => ({
        tenantId,
        staffId: kind === "staff" ? o.id : null,
        resourceId: kind === "resource" ? o.id : null,
        ...w,
      })),
    );
    if (rows.length) await tx.insert(schedules).values(rows);
  });
}

// ── Чөлөө, баяр ───────────────────────────────────────────────────────────

/** Ирээдүйн чөлөөнүүд. staffId/resourceId хоёулаа null = бүх байгууллага амарна. */
export async function listUpcomingTimeOff(tenantId: string, now = new Date()) {
  return db()
    .select()
    .from(timeOff)
    .where(and(eq(timeOff.tenantId, tenantId), gte(timeOff.endsAt, now)))
    .orderBy(asc(timeOff.startsAt))
    .limit(100);
}

export async function insertTimeOff(p: typeof timeOff.$inferInsert) {
  const [r] = await db().insert(timeOff).values(p).returning();
  return r;
}

export async function deleteTimeOff(tenantId: string, id: string) {
  await db().delete(timeOff).where(and(eq(timeOff.id, id), eq(timeOff.tenantId, tenantId)));
}
