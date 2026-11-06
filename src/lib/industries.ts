/**
 * Салбарын жагсаалт — нэг эх сурвалж. DB enum (schema.ts), бүртгэлийн шалгалт, preset бүгд эндээс уншина.
 * Шинэ салбар нэмэх: энд нэмээд presets.ts-д preset бичиж, `npm run db:generate` (ALTER TYPE ... ADD VALUE).
 * "other" үргэлж хамгийн сүүлд.
 */
export const INDUSTRY_IDS = [
  "barber", "beauty", "nails", "carwash", "clinic", "dental",
  "fitness", "photo", "education", "consulting", "pet", "other",
] as const;

export type Industry = (typeof INDUSTRY_IDS)[number];
