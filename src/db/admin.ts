/**
 * Super Admin-ы query-ууд — бүх байгууллагыг хамарна. ЗӨВХӨН requireSuperAdmin()-ээр хамгаалсан
 * хуудас/action болон ADMIN_API_TOKEN-тэй /api/admin/stats-аас дуудна.
 */
import { and, count, desc, eq, gte, sql } from "drizzle-orm";
import { db, schema } from "./index";

const { tenants, bookings, users, memberships } = schema;

const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 3600_000);

/** admin.smartuvs.mn нүүр самбарт өгөх гол тоонууд */
export async function platformStats() {
  const [t] = await db()
    .select({
      total: count(),
      active: sql<number>`count(*) filter (where ${tenants.status} = 'active')::int`,
      suspended: sql<number>`count(*) filter (where ${tenants.status} = 'suspended')::int`,
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
  const [u] = await db().select({ total: count() }).from(users);
  return {
    tenants: t,
    bookings: b,
    users: u.total,
    /** Ирээгүй хувь: ирээгүй / (ирсэн + ирээгүй), 30 хоног */
    noShowRate30d: b.noShow30d + b.attended30d > 0 ? b.noShow30d / (b.noShow30d + b.attended30d) : null,
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
      ownerName: sql<string | null>`(select ${users.name} from ${memberships} join ${users} on ${users.id} = ${memberships.userId}
        where ${memberships.tenantId} = ${tenants.id} and ${memberships.role} = 'owner' order by ${memberships.createdAt} limit 1)`,
      ownerPhone: sql<string | null>`(select ${users.phone} from ${memberships} join ${users} on ${users.id} = ${memberships.userId}
        where ${memberships.tenantId} = ${tenants.id} and ${memberships.role} = 'owner' order by ${memberships.createdAt} limit 1)`,
      bookings30d: sql<number>`(select count(*)::int from ${bookings} where ${bookings.tenantId} = ${tenants.id}
        and ${bookings.createdAt} >= ${since}::timestamptz)`,
      noShow30d: sql<number>`(select count(*)::int from ${bookings} where ${bookings.tenantId} = ${tenants.id}
        and ${bookings.createdAt} >= ${since}::timestamptz and ${bookings.status} = 'no_show')`,
      services: sql<number>`(select count(*)::int from ${schema.services} where ${schema.services.tenantId} = ${tenants.id} and ${schema.services.active})`,
    })
    .from(tenants)
    .orderBy(desc(tenants.createdAt))
    .limit(1000);
}

export async function setTenantStatus(tenantId: string, status: "active" | "suspended") {
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
