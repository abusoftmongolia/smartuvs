/**
 * Super Admin-ы query-ууд — бүх байгууллагыг хамарна. ЗӨВХӨН requireSuperAdmin()-ээр хамгаалсан
 * хуудас/action болон ADMIN_API_TOKEN-тэй /api/admin/stats-аас дуудна.
 */
import { and, count, desc, eq, gte, ilike, inArray, lt, or, sql } from "drizzle-orm";
import { noShowRate } from "@/lib/report";
import { db, schema } from "./index";

const { tenants, bookings, users, memberships, auditLogs, services, customers } = schema;

const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 3600_000);

/** admin.smartuvs.mn нүүр самбарт өгөх гол тоонууд */
export async function platformStats() {
  const [t] = await db()
    .select({
      total: count(),
      active: sql<number>`count(*) filter (where ${tenants.status} = 'active')::int`,
      suspended: sql<number>`count(*) filter (where ${tenants.status} = 'suspended')::int`,
      pending: sql<number>`count(*) filter (where ${tenants.status} = 'pending')::int`,
      new7d: sql<number>`count(*) filter (where ${tenants.createdAt} >= ${daysAgo(7).toISOString()}::timestamptz)::int`,
    })
    .from(tenants);
  const [b] = await db()
    .select({
      last24h: sql<number>`count(*) filter (where ${bookings.createdAt} >= ${daysAgo(1).toISOString()}::timestamptz)::int`,
      last7d: sql<number>`count(*) filter (where ${bookings.createdAt} >= ${daysAgo(7).toISOString()}::timestamptz)::int`,
      last30d: count(),
      noShow30d: sql<number>`count(*) filter (where ${bookings.status} = 'no_show')::int`,
      attended30d: sql<number>`count(*) filter (where ${bookings.status} in ('checked_in', 'completed'))::int`,
    })
    .from(bookings)
    .where(gte(bookings.createdAt, daysAgo(30)));
  const [u] = await db()
    .select({
      total: count(),
      new30d: sql<number>`count(*) filter (where ${users.createdAt} >= ${daysAgo(30).toISOString()}::timestamptz)::int`,
    })
    .from(users);
  return {
    tenants: t,
    bookings: b,
    users: u.total,
    usersNew30d: u.new30d,
    /** Ирээгүй хувь: ирээгүй / (ирсэн + ирээгүй), 30 хоног */
    noShowRate30d: noShowRate({ attended: b.attended30d, noShow: b.noShow30d }),
  };
}

/** Байгууллагуудын жагсаалт: эзэмшигч, 30 хоногийн захиалга, ирээгүй */
export async function listTenantsForAdmin() {
  const since = daysAgo(30).toISOString();
  return db()
    .select({
      id: tenants.id,
      slug: tenants.slug,
      name: tenants.name,
      industry: tenants.industry,
      status: tenants.status,
      address: tenants.address,
      createdAt: tenants.createdAt,
      // Дэд query-д хүснэгтийн нэрийг бүрэн бичнэ: ганц хүснэгтийн select-д Drizzle баганыг
      // "id" гэж нэргүй гаргадаг тул дэд query дотор тодорхойгүй (ambiguous) болдог.
      ownerName: sql<string | null>`(select u.name from memberships m join users u on u.id = m.user_id
        where m.tenant_id = "tenants"."id" and m.role = 'owner' order by m.created_at limit 1)`,
      ownerPhone: sql<string | null>`(select u.phone from memberships m join users u on u.id = m.user_id
        where m.tenant_id = "tenants"."id" and m.role = 'owner' order by m.created_at limit 1)`,
      bookings30d: sql<number>`(select count(*)::int from bookings b where b.tenant_id = "tenants"."id"
        and b.created_at >= ${since}::timestamptz)`,
      noShow30d: sql<number>`(select count(*)::int from bookings b where b.tenant_id = "tenants"."id"
        and b.created_at >= ${since}::timestamptz and b.status = 'no_show')`,
      services: sql<number>`(select count(*)::int from services s where s.tenant_id = "tenants"."id" and s.active)`,
    })
    .from(tenants)
    .orderBy(desc(tenants.createdAt))
    .limit(1000);
}

export async function setTenantStatus(tenantId: string, status: "pending" | "active" | "rejected" | "suspended") {
  const [t] = await db().update(tenants).set({ status }).where(eq(tenants.id, tenantId)).returning();
  return t ?? null;
}

export async function getTenantById(tenantId: string) {
  const [t] = await db().select().from(tenants).where(eq(tenants.id, tenantId)).limit(1);
  return t ?? null;
}

/** Super admin аль ч байгууллагын самбарт (тусламж үзүүлэхэд) */
export async function getTenantBySlugAnyStatus(slug: string) {
  const [t] = await db().select().from(tenants).where(and(eq(tenants.slug, slug))).limit(1);
  return t ?? null;
}

/** Өнөөдөр (Улаанбаатарын өдрөөр) эхлэх захиалга — цуцлагдсаныг оруулахгүй */
export async function bookingsOnDay(fromUtc: Date, toUtc: Date) {
  const [r] = await db()
    .select({ n: count() })
    .from(bookings)
    .where(and(gte(bookings.startsAt, fromUtc), lt(bookings.startsAt, toUtc), sql`${bookings.status} <> 'cancelled'`));
  return r?.n ?? 0;
}

/** Сүүлийн үйл ажиллагаа (audit_logs) — платформын түвшний үйлдлүүд */
const ACTIVITY_ACTIONS = [
  "tenant.create", "signup", "tenant.approve", "tenant.reject", "tenant.suspend", "tenant.activate", "maintenance.on", "maintenance.off",
  "content.industries", "content.tiles", "content.menu",
];

export async function recentActivity(limit = 12) {
  return db()
    .select({ action: auditLogs.action, at: auditLogs.at, tenantName: tenants.name, actorName: users.name })
    .from(auditLogs)
    .leftJoin(tenants, eq(tenants.id, auditLogs.tenantId))
    .leftJoin(users, eq(users.id, auditLogs.actorId))
    .where(inArray(auditLogs.action, ACTIVITY_ACTIONS))
    .orderBy(desc(auditLogs.at))
    .limit(limit);
}

export async function listUsersForAdmin(q?: string) {
  const term = q?.trim();
  return db()
    .select({
      id: users.id,
      name: users.name,
      phone: users.phone,
      isSuperAdmin: users.isSuperAdmin,
      createdAt: users.createdAt,
      tenants: sql<string | null>`(select string_agg(t.name, ', ' order by t.name) from memberships m
        join tenants t on t.id = m.tenant_id where m.user_id = "users"."id")`,
    })
    .from(users)
    .where(term ? or(ilike(users.name, `%${term}%`), ilike(users.phone, `%${term.replace(/\D/g, "") || term}%`)) : undefined)
    .orderBy(desc(users.createdAt))
    .limit(500);
}

/** Сүүлийн захиалгууд (бүх байгууллага). Үйлчлүүлэгчийн утсыг буцаахгүй. */
export async function listRecentBookingsForAdmin(limit = 200) {
  return db()
    .select({
      id: bookings.id,
      startsAt: bookings.startsAt,
      createdAt: bookings.createdAt,
      status: bookings.status,
      source: bookings.source,
      tenantName: tenants.name,
      tenantSlug: tenants.slug,
      timezone: tenants.timezone,
      serviceName: services.name,
      customerName: customers.name,
    })
    .from(bookings)
    .innerJoin(tenants, eq(tenants.id, bookings.tenantId))
    .innerJoin(services, eq(services.id, bookings.serviceId))
    .innerJoin(customers, eq(customers.id, bookings.customerId))
    .orderBy(desc(bookings.createdAt))
    .limit(limit);
}

/** Бүх цаг үеийн захиалгын тоо (цуцлагдсаныг оруулахгүй) */
export async function bookingsAllTime() {
  const [r] = await db().select({ n: count() }).from(bookings).where(sql`${bookings.status} <> 'cancelled'`);
  return r?.n ?? 0;
}

/**
 * Сүүлийн `days` хоногийн өдөр бүрийн шинэ захиалга (үүссэн өдрөөр, Улаанбаатарын цагаар).
 * Захиалгагүй өдөр 0-ээр бөглөгдөнө.
 */
export async function dailyBookings(days = 14, tz = "Asia/Ulaanbaatar") {
  const dayExpr = sql<string>`to_char(${bookings.createdAt} at time zone ${tz}, 'YYYY-MM-DD')`;
  const rows = await db()
    .select({ day: dayExpr, n: sql<number>`count(*)::int` })
    .from(bookings)
    .where(gte(bookings.createdAt, daysAgo(days + 1)))
    .groupBy(sql`1`); // tz параметр SELECT, GROUP BY-д тусдаа $n болдог тул байрлалаар
  const byDay = new Map(rows.map((r) => [r.day, r.n]));
  const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" });
  return Array.from({ length: days }, (_, i) => {
    const day = fmt.format(daysAgo(days - 1 - i));
    return { day, n: byDay.get(day) ?? 0 };
  });
}

/** Идэвхтэй байгууллага салбараар */
export async function activeTenantsByIndustry() {
  return db()
    .select({ industry: tenants.industry, n: sql<number>`count(*)::int` })
    .from(tenants)
    .where(eq(tenants.status, "active"))
    .groupBy(tenants.industry);
}
