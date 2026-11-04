/**
 * Tenant-аар шүүсэн query-ууд. Байгууллагын өгөгдлийг ЗӨВХӨН эндээс уншина —
 * ингэснээр нэг байгууллага нөгөөгийнхөө өгөгдлийг санамсаргүй харах эрсдэлгүй.
 */
import { and, asc, eq, gte, inArray, lt } from "drizzle-orm";
import { db, schema } from "./index";

const { tenants, services, staff, staffServices, schedules, timeOff, bookings, resources } = schema;

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
}) {
  const { tenantId, ownerIds, ownerKind, weekday, dayStartUtc, dayEndUtc } = params;
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
      .where(and(eq(timeOff.tenantId, tenantId), inArray(offOwner, ownerIds), lt(timeOff.startsAt, dayEndUtc), gte(timeOff.endsAt, dayStartUtc))),
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
        ),
      ),
  ]);
  return { schedules: sch, timeOff: off, bookings: bk };
}
