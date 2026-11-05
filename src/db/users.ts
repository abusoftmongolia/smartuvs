/**
 * Хэрэглэгч, session, гишүүнчлэлийн query-ууд. Эдгээр нь нэг байгууллагад хамаарахгүй
 * (нэг хүн хэд хэдэн байгууллагын гишүүн байж болно) тул tenant.ts-ээс тусад нь.
 */
import { and, asc, count, eq, gt, lt } from "drizzle-orm";
import { db, schema } from "./index";

const { users, sessions, memberships, tenants, auditLogs } = schema;

export type Role = (typeof schema.roleEnum.enumValues)[number];

export async function getUserByPhone(phone: string) {
  const [u] = await db().select().from(users).where(eq(users.phone, phone)).limit(1);
  return u ?? null;
}

export async function getUserById(id: string) {
  const [u] = await db().select().from(users).where(eq(users.id, id)).limit(1);
  return u ?? null;
}

export async function insertSession(p: { id: string; userId: string; expiresAt: Date }) {
  await db().insert(sessions).values(p);
}

/** Хүчинтэй session-ий хэрэглэгч */
export async function getSessionUser(sessionId: string) {
  const [row] = await db()
    .select({
      id: users.id,
      name: users.name,
      phone: users.phone,
      isSuperAdmin: users.isSuperAdmin,
      expiresAt: sessions.expiresAt,
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.id, sessionId), gt(sessions.expiresAt, new Date())))
    .limit(1);
  return row ?? null;
}

export async function deleteSession(sessionId: string) {
  await db().delete(sessions).where(eq(sessions.id, sessionId));
}

/** Нууц үг солигдоход бусад бүх төхөөрөмжөөс гаргана */
export async function deleteUserSessions(userId: string) {
  await db().delete(sessions).where(eq(sessions.userId, userId));
}

export async function deleteExpiredSessions() {
  await db().delete(sessions).where(lt(sessions.expiresAt, new Date()));
}

export async function setUserPassword(userId: string, passwordHash: string) {
  await db().update(users).set({ passwordHash, phoneVerifiedAt: new Date() }).where(eq(users.id, userId));
}

/** Хэрэглэгчийн гишүүн байгууллагууд */
export async function listUserTenants(userId: string) {
  return db()
    .select({ id: tenants.id, slug: tenants.slug, name: tenants.name, role: memberships.role, status: tenants.status })
    .from(memberships)
    .innerJoin(tenants, eq(tenants.id, memberships.tenantId))
    .where(eq(memberships.userId, userId))
    .orderBy(asc(tenants.name));
}

/** slug-аар байгууллага + энэ хэрэглэгчийн эрх. Гишүүн биш бол null. */
export async function getMembershipBySlug(userId: string, slug: string) {
  const [row] = await db()
    .select({ tenant: tenants, role: memberships.role })
    .from(memberships)
    .innerJoin(tenants, eq(tenants.id, memberships.tenantId))
    .where(and(eq(memberships.userId, userId), eq(tenants.slug, slug)))
    .limit(1);
  return row ?? null;
}

// ── Rate limit (audit_logs дээр) ──────────────────────────────────────────

export async function countRecentEvents(action: string, key: string, sinceMs: number) {
  const [r] = await db()
    .select({ n: count() })
    .from(auditLogs)
    .where(and(eq(auditLogs.action, action), eq(auditLogs.entityId, key), gt(auditLogs.at, new Date(Date.now() - sinceMs))));
  return r?.n ?? 0;
}

export async function recordEvent(p: { action: string; entity: string; key: string; tenantId?: string; actorId?: string }) {
  await db().insert(auditLogs).values({
    action: p.action,
    entity: p.entity,
    entityId: p.key,
    tenantId: p.tenantId ?? null,
    actorId: p.actorId ?? null,
  });
}
