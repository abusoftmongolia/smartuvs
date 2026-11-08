"use server";
/**
 * Байгууллагын хаяг (tsag.smartuvs.mn/<slug>):
 *  - checkSlug        — бичих явцад "Сул байна / Эзэнтэй" шалгана (бүртгэл, тохиргоо)
 *  - changeTenantSlugAction — тохиргооноос хаягаа солино; хуучин хаяг шинэ рүү шилжинэ
 */
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, pgErrorCode, PG_UNIQUE_VIOLATION, schema } from "@/db";
import { changeTenantSlug, isSlugTaken } from "@/db/tenant";
import { countRecentEvents } from "@/db/users";
import { slugProblem } from "@/lib/slug";
import { currentUser, memberOrNull } from "./auth";

export type SlugResult = { ok: true; slug: string } | { ok: false; message: string };

const TAKEN_MESSAGE = "Энэ хаяг эзэнтэй байна. Өөр хаяг сонгоно уу";
/** Нэг байгууллага хоногт хэдэн удаа хаягаа солих вэ — хуучин хаягууд хуримтлагдахаас сэргийлнэ */
const MAX_CHANGES_PER_DAY = 3;

const Input = z.object({
  slug: z.string().max(64),
  /** Тохиргооноос шалгаж буй бол одоогийн хаяг — өөрийн хуучин хаяг руу буцахыг зөвшөөрнө */
  currentSlug: z.string().max(64).optional(),
});

export async function checkSlug(raw: unknown): Promise<SlugResult> {
  const parsed = Input.safeParse(raw);
  if (!parsed.success) return { ok: false, message: "Хаяг буруу" };
  const { slug, currentSlug } = parsed.data;
  const problem = slugProblem(slug);
  if (problem) return { ok: false, message: problem };

  let exceptTenantId: string | undefined;
  if (currentSlug) {
    const m = await memberOrNull(currentSlug, "manager");
    if (!m) return { ok: false, message: "Эрх хүрэхгүй байна" };
    if (slug === m.tenant.slug) return { ok: true, slug };
    exceptTenantId = m.tenant.id;
  } else if (!(await currentUser())) {
    return { ok: false, message: "Эхлээд нэвтэрнэ үү" };
  }
  return (await isSlugTaken(slug, exceptTenantId)) ? { ok: false, message: TAKEN_MESSAGE } : { ok: true, slug };
}

export async function changeTenantSlugAction(raw: unknown): Promise<SlugResult> {
  const parsed = Input.required({ currentSlug: true }).safeParse(raw);
  if (!parsed.success) return { ok: false, message: "Хаяг буруу" };
  const { slug, currentSlug } = parsed.data;
  const m = await memberOrNull(currentSlug, "manager");
  if (!m) return { ok: false, message: "Эрх хүрэхгүй байна" };
  if (slug === m.tenant.slug) return { ok: true, slug };
  const problem = slugProblem(slug);
  if (problem) return { ok: false, message: problem };

  if ((await countRecentEvents("tenant.slug", m.tenant.id, 24 * 3600_000)) >= MAX_CHANGES_PER_DAY) {
    return { ok: false, message: `Хаягийг хоногт ${MAX_CHANGES_PER_DAY}-аас олон удаа солих боломжгүй` };
  }
  if (await isSlugTaken(slug, m.tenant.id)) return { ok: false, message: TAKEN_MESSAGE };

  try {
    await changeTenantSlug(m.tenant.id, m.tenant.slug, slug, m.tenant.logoUrl);
  } catch (err) {
    if (pgErrorCode(err) === PG_UNIQUE_VIOLATION) return { ok: false, message: TAKEN_MESSAGE };
    console.error("changeTenantSlug", err);
    return { ok: false, message: "Алдаа гарлаа. Дахин оролдоно уу." };
  }
  // countRecentEvents("tenant.slug", tenantId)-д тоологдоно
  await db().insert(schema.auditLogs).values({
    tenantId: m.tenant.id, actorId: m.user.id, action: "tenant.slug", entity: "tenant", entityId: m.tenant.id,
    diff: { from: m.tenant.slug, to: slug },
  });
  revalidatePath("/", "layout");
  return { ok: true, slug };
}
