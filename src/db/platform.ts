/** Платформын тохиргоо (platform_settings). Жишээ: засварын горим. */
import { eq } from "drizzle-orm";
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
