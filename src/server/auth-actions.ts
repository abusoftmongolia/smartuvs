"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  countRecentEvents,
  deleteUserSessions,
  getUserById,
  getUserByPhone,
  listUserTenants,
  recordEvent,
  setUserPassword,
} from "@/db/users";
import { hashPassword, passwordProblem, verifyPassword } from "@/lib/password";
import { normalizePhone } from "@/lib/sms";
import { endSession, rateKey, startSession } from "./auth";
import { isPhoneVerified } from "./phone-verification";

const FAIL_WINDOW_MS = 15 * 60_000;
const MAX_FAILS = 5;
/** Хэрэглэгч байхгүй үед ч ижил хугацаа зарцуулж, дугаар бүртгэлтэй эсэхийг задруулахгүй */
const DUMMY_HASH = "scrypt$16384$8$1$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

export type AuthResult = { ok: false; message: string } | undefined;

const LoginInput = z.object({
  phone: z.string().max(32),
  password: z.string().min(1, "Нууц үгээ оруулна уу").max(128),
  next: z.string().max(200).optional(),
  /** "admin" = /admin/login: зөвхөн super admin нэвтэрч, шууд /admin руу орно */
  scope: z.enum(["tenant", "admin"]).default("tenant"),
});

export async function login(raw: unknown): Promise<AuthResult> {
  const parsed = LoginInput.safeParse(raw);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Мэдээлэл буруу" };
  const phone = normalizePhone(parsed.data.phone);
  if (!phone) return { ok: false, message: "Утасны дугаар 8 оронтой байх ёстой" };

  const key = rateKey(phone);
  if ((await countRecentEvents("login_failed", key, FAIL_WINDOW_MS)) >= MAX_FAILS) {
    return { ok: false, message: "Олон удаа буруу оруулсан тул 15 минут хүлээнэ үү" };
  }

  const user = await getUserByPhone(phone);
  const ok = await verifyPassword(parsed.data.password, user?.passwordHash ?? DUMMY_HASH);
  // Админ хэсэгт super admin биш хүн нэвтрэхийг ердийн "буруу" хариугаар татгалзана
  // (аль дугаар админ эрхтэй болохыг задруулахгүй)
  const adminDenied = parsed.data.scope === "admin" && !user?.isSuperAdmin;
  if (!user || !user.passwordHash || !ok || adminDenied) {
    await recordEvent({ action: "login_failed", entity: "user", key });
    return { ok: false, message: "Утас эсвэл нууц үг буруу байна" };
  }

  await startSession(user.id);
  await recordEvent({ action: "login", entity: "user", key: user.id, actorId: user.id });
  redirect(parsed.data.scope === "admin" ? "/admin" : await afterLoginPath(user.id, parsed.data.next));
}

async function afterLoginPath(userId: string, next?: string) {
  // Зөвхөн дотоод зам руу (open redirect-ээс сэргийлнэ)
  if (next && /^\/admin(\/[a-z0-9-]+)*\/?$/.test(next) && (await getUserById(userId))?.isSuperAdmin) return next;
  if (next && /^\/dashboard(\/[a-z0-9-]+)*\/?$/.test(next)) return next;
  const list = await listUserTenants(userId);
  if (list.length === 1) return `/dashboard/${list[0].slug}`;
  const user = await getUserById(userId);
  return list.length === 0 && user?.isSuperAdmin ? "/admin" : "/dashboard";
}

export async function logout() {
  await endSession();
  redirect("/login");
}

/** Админ хэсгээс гарах — админы нэвтрэх хуудас руу буцна */
export async function logoutAdmin() {
  await endSession();
  redirect("/admin/login");
}

const ResetInput = z.object({
  phone: z.string().max(32),
  verifyToken: z.string().min(1).max(1024),
  password: z.string().max(200),
  next: z.string().max(200).optional(),
});

/** Нууц үг сэргээх: verify.mn-ээр дугаараа баталгаажуулсны дараа шинэ нууц үг тохируулна */
export async function resetPassword(raw: unknown): Promise<AuthResult> {
  const parsed = ResetInput.safeParse(raw);
  if (!parsed.success) return { ok: false, message: "Мэдээлэл буруу" };
  const phone = normalizePhone(parsed.data.phone);
  if (!phone) return { ok: false, message: "Утасны дугаар 8 оронтой байх ёстой" };
  const problem = passwordProblem(parsed.data.password);
  if (problem) return { ok: false, message: problem };
  if (!(await isPhoneVerified(parsed.data.verifyToken, phone))) {
    return { ok: false, message: "Утасны дугаараа баталгаажуулна уу" };
  }

  const user = await getUserByPhone(phone);
  if (!user) return { ok: false, message: "Энэ дугаараар бүртгэл олдсонгүй" };

  await setUserPassword(user.id, await hashPassword(parsed.data.password));
  await deleteUserSessions(user.id);
  await recordEvent({ action: "password_reset", entity: "user", key: user.id, actorId: user.id });
  await startSession(user.id);
  redirect(await afterLoginPath(user.id, parsed.data.next));
}
