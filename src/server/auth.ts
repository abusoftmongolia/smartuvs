import "server-only";
/**
 * Нэвтрэлт: утас + нууц үг → session cookie (30 хоног).
 * Хуудас, action бүр requireUser / requireMember-ээр эрхээ шалгана.
 */
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { getTenantBySlugAnyStatus } from "@/db/admin";
import { deleteSession, getMembershipBySlug, getSessionUser, insertSession, type Role } from "@/db/users";
import { hashSessionToken, newSessionToken, phoneKey, SESSION_COOKIE, SESSION_TTL_MS } from "@/lib/session-token";

export function authSecret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error("SESSION_SECRET 32+ тэмдэгт байх ёстой (.env)");
  return s;
}

export function rateKey(phone: string): string {
  return phoneKey(phone, authSecret());
}

export async function startSession(userId: string) {
  const token = newSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await insertSession({ id: hashSessionToken(token), userId, expiresAt });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function endSession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await deleteSession(hashSessionToken(token));
  jar.delete(SESSION_COOKIE);
}

/** Нэг request дотор нэг л удаа санд хандана */
export const currentUser = cache(async () => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return getSessionUser(hashSessionToken(token));
});

export async function requireUser() {
  const user = await currentUser();
  if (!user) redirect("/admin/login");
  return user;
}

const RANK: Record<Role, number> = { staff: 1, manager: 2, owner: 3 };

/**
 * Хэрэглэгчийн энэ байгууллага дахь эрх. Super admin бүх байгууллагад "owner" эрхтэй
 * (тусламж үзүүлэхэд); үйлдэл бүр audit_logs-д түүний нэрээр бичигдэнэ.
 */
async function resolveMembership(user: { id: string; isSuperAdmin: boolean }, slug: string) {
  const m = await getMembershipBySlug(user.id, slug);
  if (m) return m;
  if (user.isSuperAdmin) {
    const tenant = await getTenantBySlugAnyStatus(slug);
    if (tenant) return { tenant, role: "owner" as Role };
  }
  return null;
}

/**
 * Байгууллагын самбарт хандах эрх. Гишүүн биш бол 404 мэт /dashboard руу буцаана
 * (өөр байгууллага байгаа эсэхийг ч задруулахгүй).
 */
export const requireMember = cache(async (slug: string, minRole: Role = "staff") => {
  const user = await requireUser();
  const m = await resolveMembership(user, slug);
  if (!m || RANK[m.role] < RANK[minRole]) redirect("/dashboard");
  return { user, tenant: m.tenant, role: m.role };
});

/** Server action-д: redirect биш, алдаа буцаахад зориулсан хувилбар */
export async function memberOrNull(slug: string, minRole: Role = "staff") {
  const user = await currentUser();
  if (!user) return null;
  const m = await resolveMembership(user, slug);
  if (!m || RANK[m.role] < RANK[minRole]) return null;
  return { user, tenant: m.tenant, role: m.role };
}

/** SmartUvs super admin. Эрхгүй бол 404 (админ хэсэг байгааг ч задруулахгүй). */
export async function requireSuperAdmin() {
  const user = await currentUser();
  if (!user) redirect("/login"); // admin.smartuvs.mn/login (middleware → /platform/login)
  if (!user.isSuperAdmin) notFound();
  return user;
}

export async function superAdminOrNull() {
  const user = await currentUser();
  return user?.isSuperAdmin ? user : null;
}
