/** Платформын тохиргоо (platform_settings). Жишээ: засварын горим. */
import { eq } from "drizzle-orm";
import { cache } from "react";
import { INDUSTRY_PRESETS } from "@/lib/presets";
import { resolveIndustries, resolveMenu, resolveTiles, SETTING_KEYS } from "@/lib/site-config";
import { db, schema } from "./index";

const { platformSettings } = schema;

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const [r] = await db().select({ value: platformSettings.value }).from(platformSettings).where(eq(platformSettings.key, key)).limit(1);
  return r ? (r.value as T) : fallback;
}

export async function setSetting(key: string, value: unknown) {
  await db()
    .insert(platformSettings)
    .values({ key, value, updatedAt: new Date() })
    .onConflictDoUpdate({ target: platformSettings.key, set: { value, updatedAt: new Date() } });
}

/** tsag систем засвартай эсэх — захиалгын хуудас, шинэ захиалгыг түр зогсооно */
export async function isTsagMaintenance(): Promise<boolean> {
  try {
    return (await getSetting<boolean>("maintenance.tsag", false)) === true;
  } catch {
    return false; // Тохиргоо уншиж чадахгүй бол үйлчилгээг зогсоохгүй
  }
}

/* ── Нүүр хуудасны агуулга (Ангилал, Үндсэн цэс, хавтан) ── */

const INDUSTRY_LABELS = Object.fromEntries(Object.values(INDUSTRY_PRESETS).map((p) => [p.id, p.label])) as Parameters<typeof resolveIndustries>[1];

/** Тохиргоо уншиж чадахгүй бол анхны утгаар (нүүр хуудас унахгүй) */
async function safeSetting(key: string): Promise<unknown> {
  try {
    return await getSetting<unknown>(key, undefined);
  } catch {
    return undefined;
  }
}

export const getSiteConfig = cache(async () => {
  const [ind, menu, tiles] = await Promise.all([
    safeSetting(SETTING_KEYS.industries), safeSetting(SETTING_KEYS.menu), safeSetting(SETTING_KEYS.tiles),
  ]);
  return { industries: resolveIndustries(ind, INDUSTRY_LABELS), menu: resolveMenu(menu), tiles: resolveTiles(tiles) };
});
