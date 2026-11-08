"use server";
/**
 * Super Admin → Цаг захиалга: нүүр хуудасны агуулга (Ангилал, хавтан, Үндсэн цэс).
 * platform_settings-д хадгалж нүүр хуудсыг шинэчилнэ.
 */
import { revalidatePath } from "next/cache";
import type { z } from "zod";
import { setSetting } from "@/db/platform";
import { recordEvent } from "@/db/users";
import { IndustriesConfig, MenuConfig, SETTING_KEYS, TilesConfig } from "@/lib/site-config";
import type { AdminResult } from "./admin-actions";
import { superAdminOrNull } from "./auth";

async function save(kind: keyof typeof SETTING_KEYS, schema: z.ZodTypeAny, raw: unknown): Promise<AdminResult> {
  const admin = await superAdminOrNull();
  if (!admin) return { ok: false, message: "Эрх хүрэхгүй байна" };
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Мэдээлэл буруу" };
  await setSetting(SETTING_KEYS[kind], parsed.data);
  await recordEvent({ action: `content.${kind}`, entity: "system", key: "tsag", actorId: admin.id });
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function saveIndustries(raw: unknown) {
  return save("industries", IndustriesConfig, raw);
}
export async function saveTiles(raw: unknown) {
  return save("tiles", TilesConfig, raw);
}
export async function saveMenu(raw: unknown) {
  return save("menu", MenuConfig, raw);
}
