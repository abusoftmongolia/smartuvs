/**
 * Нүүр хуудасны агуулгын тохиргоо (Super Admin → Цаг захиалга → Ангилал / Үндсэн цэс).
 * platform_settings-д JSON-оор хадгална; энд зөвхөн ЦЭВЭР логик: схем, анхны утга, задлах (tests/site-config.test.ts).
 * Салбарын жагсаалт өөрөө (DB enum) industries.ts-д — энд зөвхөн нэр, дараалал, харагдах эсэхийг өөрчилнө.
 */
import { z } from "zod";
import { INDUSTRY_IDS, type Industry } from "./industries";

export const SETTING_KEYS = { industries: "tsag.industries", menu: "tsag.menu", tiles: "tsag.tiles" } as const;

const IndustryId = z.enum(INDUSTRY_IDS);
const Label = z.string().trim().min(1, "Нэр хоосон байна").max(40, "Нэр 40 тэмдэгтээс урт байна");

/* ── Салбар (ангилал) ─────────────────────────────────────────── */

export const IndustriesConfig = z.object({
  /** Харуулах дараалал. Жагсаалтад байхгүй салбар төгсгөлд анхны дарааллаараа нэмэгдэнэ */
  order: z.array(IndustryId).max(INDUSTRY_IDS.length),
  /** Preset-ийн нэрийг дарж бичих */
  labels: z.record(z.string(), Label).default({}),
  /** Нүүрний цэс, шүүлтүүрээс нуух (байгууллагууд нь жагсаалтад хэвээр харагдана) */
  hidden: z.array(IndustryId).default([]),
});
export type IndustriesConfig = z.infer<typeof IndustriesConfig>;

export type ResolvedIndustry = { id: Industry; label: string; defaultLabel: string; hidden: boolean };

export function resolveIndustries(raw: unknown, defaults: Record<Industry, string>): ResolvedIndustry[] {
  const p = IndustriesConfig.safeParse(raw);
  const cfg = p.success ? p.data : { order: [], labels: {}, hidden: [] };
  const seen = new Set<Industry>();
  const order: Industry[] = [];
  for (const id of [...cfg.order, ...INDUSTRY_IDS]) if (!seen.has(id)) { seen.add(id); order.push(id); }
  // "other" (Бусад) үргэлж хамгийн сүүлд
  const ordered = [...order.filter((id) => id !== "other"), "other" as const];
  const labels = cfg.labels as Partial<Record<string, string>>;
  return ordered.map((id) => ({
    id,
    label: labels[id] ?? defaults[id],
    defaultLabel: defaults[id],
    hidden: cfg.hidden.includes(id),
  }));
}

/** Нүүрний цэс/шүүлтүүрт харагдах салбарууд ("Бусад" болон нуусныг оруулахгүй) */
export const visibleIndustries = (list: ResolvedIndustry[]) => list.filter((i) => !i.hidden && i.id !== "other");

/* ── Үндсэн цэс ──────────────────────────────────────────────── */

/** Дотоод зам ("/business", "/?industry=x#list") эсвэл https холбоос. "//evil.com", "javascript:" хориглоно */
export const MenuHref = z
  .string()
  .trim()
  .max(200)
  .refine((h) => /^\/(?!\/)[^\s]*$/.test(h) || /^https:\/\/[^\s/]+\.[^\s]+$/.test(h), "Холбоос \"/\"-ээр эсвэл \"https://\"-ээр эхлэх ёстой");

export const MenuItem = z.object({
  id: z.string().regex(/^[a-z0-9-]{1,40}$/),
  /** "industries" — салбаруудыг автоматаар дэлгэнэ (нэр, холбоос шаардахгүй) */
  kind: z.enum(["link", "industries"]).default("link"),
  label: Label,
  href: z.string().default(""),
  visible: z.boolean().default(true),
  /** Онцлох (шар-хүрэн бичиг) */
  accent: z.boolean().default(false),
}).superRefine((it, ctx) => {
  if (it.kind === "link" && !MenuHref.safeParse(it.href).success) {
    ctx.addIssue({ code: "custom", path: ["href"], message: `"${it.label}": холбоос "/"-ээр эсвэл "https://"-ээр эхлэх ёстой` });
  }
});
export type MenuItem = z.infer<typeof MenuItem>;

export const MenuConfig = z.object({ items: z.array(MenuItem).max(20) }).superRefine((m, ctx) => {
  if (m.items.filter((i) => i.kind === "industries").length > 1) ctx.addIssue({ code: "custom", message: "Салбарын бүлэг нэг л удаа орно" });
  if (new Set(m.items.map((i) => i.id)).size !== m.items.length) ctx.addIssue({ code: "custom", message: "Давхардсан мөр байна" });
});
export type MenuConfig = z.infer<typeof MenuConfig>;

export const DEFAULT_MENU: MenuConfig = {
  items: [
    { id: "all", kind: "link", label: "Бүх салбар", href: "/#list", visible: true, accent: false },
    { id: "industries", kind: "industries", label: "Салбарууд", href: "", visible: true, accent: false },
    { id: "business", kind: "link", label: "Байгууллагад", href: "/business", visible: true, accent: true },
  ],
};

export function resolveMenu(raw: unknown): MenuConfig {
  const p = MenuConfig.safeParse(raw);
  return p.success ? p.data : DEFAULT_MENU;
}

/** Цэсийн бодит холбоосууд — "industries" бүлгийг салбар бүрээр дэлгэнэ */
export type NavLink = { key: string; label: string; href: string; accent: boolean; icon?: "grid" };
export function expandMenu(menu: MenuConfig, industries: { id: string; label: string }[]): NavLink[] {
  return menu.items.filter((i) => i.visible).flatMap((i): NavLink[] =>
    i.kind === "industries"
      ? industries.map((ind) => ({ key: `ind-${ind.id}`, label: ind.label, href: `/?industry=${ind.id}#list`, accent: false }))
      : [{ key: i.id, label: i.label, href: i.href, accent: i.accent, icon: i.href === "/#list" ? "grid" : undefined }],
  );
}

/* ── Нүүрний ангиллын хавтан (3 ширхэг) ──────────────────────── */

export const Tile = z.object({
  title: Label,
  kicker: z.string().trim().max(60, "Тайлбар 60 тэмдэгтээс урт байна").default(""),
  industries: z.array(IndustryId).min(1, "Хавтан бүрт дор хаяж нэг салбар сонгоно уу"),
});
export type Tile = z.infer<typeof Tile>;
export const TilesConfig = z.object({ tiles: z.array(Tile).length(3) });

export const DEFAULT_TILES: Tile[] = [
  { title: "Гоо сайхан", kicker: "Үсчин, гоо сайхан, хумс", industries: ["barber", "beauty", "nails"] },
  { title: "Эрүүл мэнд", kicker: "Эмнэлэг, шүдний эмнэлэг", industries: ["clinic", "dental"] },
  { title: "Авто үйлчилгээ", kicker: "Угаалга, засвар", industries: ["carwash"] },
];

export function resolveTiles(raw: unknown): Tile[] {
  const p = TilesConfig.safeParse(raw);
  return p.success ? p.data.tiles : DEFAULT_TILES;
}

export const tileHref = (t: Tile) => `/?industry=${t.industries.join(",")}#list`;
