"use server";
/**
 * Байгууллага өөрөө бүртгүүлэх (/signup).
 *  1. registerAccount — verify.mn-ээр баталгаажсан утсаар хэрэглэгч үүсгэж нэвтрүүлнэ
 *  2. createTenant    — нэвтэрсэн хэрэглэгч байгууллагаа бүх тохиргоотой нь нэг дор үүсгэнэ
 */
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, pgErrorCode, PG_UNIQUE_VIOLATION, schema } from "@/db";
import { insertTenantSetup, isSlugTaken } from "@/db/tenant";
import { countRecentEvents, deleteUserSessions, getUserByPhone, recordEvent, setUserPassword } from "@/db/users";
import { weekHoursProblem, weekHoursToWindows } from "@/lib/hours";
import { hashPassword, passwordProblem } from "@/lib/password";
import { defaultSettings, INDUSTRY_IDS, INDUSTRY_PRESETS } from "@/lib/presets";
import { normalizePhone } from "@/lib/sms";
import { slugProblem, uniqueSlug } from "@/lib/slug";
import { currentUser, rateKey, startSession } from "./auth";
import { isPhoneVerified } from "./phone-verification";

export type SignupResult<T = object> = ({ ok: true } & T) | { ok: false; message: string };

/** Нэг дугаараар хоногт үүсгэх байгууллагын дээд тоо (CLAUDE.md) */
const MAX_TENANTS_PER_DAY = 3;

const AccountInput = z.object({
  name: z.string().trim().min(1, "Нэрээ оруулна уу").max(80),
  phone: z.string().max(32),
  password: z.string().max(200),
  verifyToken: z.string().min(1).max(1024),
});

export async function registerAccount(raw: unknown): Promise<SignupResult> {
  const parsed = AccountInput.safeParse(raw);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Мэдээлэл буруу" };
  const { name, password, verifyToken } = parsed.data;
  const phone = normalizePhone(parsed.data.phone);
  if (!phone) return { ok: false, message: "Утасны дугаар 8 оронтой байх ёстой" };
  const problem = passwordProblem(password);
  if (problem) return { ok: false, message: problem };
  if (!(await isPhoneVerified(verifyToken, phone))) return { ok: false, message: "Утасны дугаараа баталгаажуулна уу" };

  const hash = await hashPassword(password);
  const existing = await getUserByPhone(phone);
  let userId: string;
  if (existing) {
    // Дугаараа SMS-ээр баталгаажуулсан тул нууц үг сэргээхтэй адил — шинэ нууц үгийг тохируулна
    await setUserPassword(existing.id, hash);
    await deleteUserSessions(existing.id);
    userId = existing.id;
  } else {
    const [u] = await db()
      .insert(schema.users)
      .values({ phone, name, passwordHash: hash, phoneVerifiedAt: new Date() })
      .returning({ id: schema.users.id });
    userId = u.id;
  }
  await recordEvent({ action: existing ? "password_reset" : "signup", entity: "user", key: userId, actorId: userId });
  await startSession(userId);
  return { ok: true };
}

const TenantInput = z.object({
  name: z.string().trim().min(2, "Байгууллагын нэрээ оруулна уу").max(80),
  /** Хэрэглэгчийн сонгосон хаяг. Хоосон бол нэрнээс автоматаар (богино) үүсгэнэ. */
  slug: z.string().trim().max(64).optional(),
  industry: z.enum(INDUSTRY_IDS),
  timezone: z.enum(["Asia/Hovd", "Asia/Ulaanbaatar"]),
  address: z.string().trim().max(160).optional(),
  phone: z.string().max(32).optional(),
  services: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(80),
        durationMin: z.number().int().min(5).max(600),
        bufferMin: z.number().int().min(0).max(120),
        price: z.number().int().min(0).max(100_000_000).nullable(),
      }),
    )
    .min(1, "Ядаж нэг үйлчилгээ нэмнэ үү")
    .max(50),
  hours: z
    .array(
      z.object({
        weekday: z.number().int().min(0).max(6),
        open: z.boolean(),
        start: z.number().int().min(0).max(1440),
        end: z.number().int().min(0).max(1440),
        breakStart: z.number().int().min(0).max(1440).nullable(),
        breakEnd: z.number().int().min(0).max(1440).nullable(),
      }),
    )
    .length(7),
  owners: z.array(z.string().trim().min(1).max(60)).min(1, "Ядаж нэг ажилтан/бокс нэмнэ үү").max(30),
});

/** field: "slug" — client хаягийн алхам руу буцаана */
export async function createTenant(raw: unknown): Promise<SignupResult<{ slug: string }> | { ok: false; message: string; field: "slug" }> {
  const user = await currentUser();
  if (!user) return { ok: false, message: "Эхлээд бүртгэлээ үүсгэнэ үү" };

  const parsed = TenantInput.safeParse(raw);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Мэдээлэл буруу" };
  const input = parsed.data;
  const hoursProblem = weekHoursProblem(input.hours);
  if (hoursProblem) return { ok: false, message: hoursProblem };
  const contactPhone = input.phone?.trim() ? normalizePhone(input.phone) : null;
  if (input.phone?.trim() && !contactPhone) return { ok: false, message: "Холбогдох утас 8 оронтой байх ёстой" };

  const key = rateKey(user.phone);
  if ((await countRecentEvents("tenant.create", key, 24 * 3600_000)) >= MAX_TENANTS_PER_DAY) {
    return { ok: false, message: `Нэг дугаараар хоногт ${MAX_TENANTS_PER_DAY}-аас олон байгууллага үүсгэх боломжгүй` };
  }

  const chosen = input.slug || null;
  if (chosen) {
    const problem = slugProblem(chosen);
    if (problem) return { ok: false, message: problem, field: "slug" };
  }
  const SLUG_TAKEN = { ok: false as const, message: "Энэ хаяг эзэнтэй байна. Өөр хаяг сонгоно уу", field: "slug" as const };

  const preset = INDUSTRY_PRESETS[input.industry];
  // Хоёр хүн нэг нэрийг зэрэг бүртгүүлбэл slug давхцаж болно (23505) — дахин оролдоно
  for (let attempt = 0; attempt < 3; attempt++) {
    if (chosen && (await isSlugTaken(chosen))) return SLUG_TAKEN;
    const slug = chosen ?? (await uniqueSlug(input.name, (x) => isSlugTaken(x)));
    try {
      const t = await insertTenantSetup({
        tenant: {
          slug,
          name: input.name,
          industry: input.industry,
          bookingMode: preset.bookingMode,
          timezone: input.timezone,
          address: input.address || null,
          phone: contactPhone,
          settings: defaultSettings(input.industry),
          // Super Admin батлах хүртэл нийтэд харагдахгүй (/admin → Батлах)
          status: "pending",
        },
        ownerUserId: user.id,
        services: input.services,
        owners: input.owners,
        schedule: weekHoursToWindows(input.hours),
      });
      await recordEvent({ action: "tenant.create", entity: "tenant", key, tenantId: t.id, actorId: user.id });
      revalidatePath("/");
      return { ok: true, slug: t.slug };
    } catch (err) {
      if (pgErrorCode(err) === PG_UNIQUE_VIOLATION) {
        if (chosen) return SLUG_TAKEN;
        continue;
      }
      console.error("createTenant", err);
      return { ok: false, message: "Алдаа гарлаа. Дахин оролдоно уу." };
    }
  }
  return { ok: false, message: "Алдаа гарлаа. Дахин оролдоно уу." };
}
