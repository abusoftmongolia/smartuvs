/**
 * Байгууллагын нэрнээс URL-ын slug үүсгэнэ: "Хатан Салон" → "hatan-salon"
 * Хаяг: tsag.smartuvs.mn/<slug>
 */

const CYRILLIC_TO_LATIN: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "j", з: "z", и: "i", й: "i",
  к: "k", л: "l", м: "m", н: "n", о: "o", ө: "u", п: "p", р: "r", с: "s", т: "t", у: "u",
  ү: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sh", ъ: "", ы: "y", ь: "i", э: "e",
  ю: "yu", я: "ya",
};

/** Апп-ын өөрийн замуудтай давхцах тул байгууллагын slug болж болохгүй үгс */
export const RESERVED_SLUGS = new Set([
  "admin", "api", "app", "dashboard", "login", "logout", "signup", "register", "settings",
  "help", "support", "about", "terms", "privacy", "booking", "manage", "b", "s", "www",
  "static", "assets", "public", "_next", "favicon.ico", "robots.txt", "sitemap.xml",
  "smartuvs", "tsag", "ajil", "business", "biznes", "platform",
]);

export function slugify(name: string): string {
  const latin = name
    .toLowerCase()
    .split("")
    .map((c) => CYRILLIC_TO_LATIN[c] ?? c)
    .join("");
  const slug = latin
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48)
    .replace(/-+$/g, "");
  return slug;
}

export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9](?:[a-z0-9-]{1,46}[a-z0-9])?$/.test(slug) && !RESERVED_SLUGS.has(slug);
}

/** Хэрэглэгч өөрөө сонгох хаягийн урт */
export const SLUG_MIN = 3;
export const SLUG_MAX = 30;
/** Автоматаар санал болгох хаягийн дээд урт — ярихад, гараар бичихэд амар */
const SUGGEST_MAX = 20;

/** Урт нэрнээс хасаж болох ерөнхий үгс (латинаар) — хаягт мэдээлэл нэмдэггүй */
const GENERIC_WORDS = new Set([
  "hhk", "hk", "llc", "tuv", "emneleg", "salon", "baiguullaga", "kompani", "uilchilgee", "delguur", "studi", "studio",
]);

/**
 * Нэрнээс БОГИНО хаяг санал болгоно:
 *  "Анагаах увидас уламжлалтын эмнэлэг" → "anagaah-uvidas"
 *  "Хатан Салон" → "hatan-salon" (богино тул хэвээр)
 * Урт бол ерөнхий үгсийг хасаад, үгийн хилээр SUGGEST_MAX хүртэл таслана.
 */
export function suggestSlug(name: string): string {
  const full = slugify(name);
  if (full.length <= SUGGEST_MAX) return full;
  const words = full.split("-");
  const meaningful = words.filter((w) => !GENERIC_WORDS.has(w));
  const pool = meaningful.length > 0 ? meaningful : words;
  let out = "";
  for (const w of pool) {
    const next = out ? `${out}-${w}` : w;
    if (next.length > SUGGEST_MAX) break;
    out = next;
  }
  // Эхний үг дангаараа хэт урт бол таслана
  return out || pool[0].slice(0, SUGGEST_MAX);
}

/** Бичих явцад оролтыг хаяг болгоно: кирилл → латин, зай → "-", бусдыг хасна (төгсгөлийн "-"-г үлдээнэ) */
export function slugInput(raw: string): string {
  return raw
    .toLowerCase()
    .split("")
    .map((c) => CYRILLIC_TO_LATIN[c] ?? c)
    .join("")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+/, "")
    .slice(0, SLUG_MAX);
}

/** Хэрэглэгчийн сонгосон хаягийн алдаа (монголоор), зөв бол null */
export function slugProblem(slug: string): string | null {
  if (slug.length < SLUG_MIN) return `Хаяг хамгийн багадаа ${SLUG_MIN} тэмдэгт байна`;
  if (slug.length > SLUG_MAX) return `Хаяг ${SLUG_MAX} тэмдэгтээс урт байж болохгүй`;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return "Зөвхөн латин жижиг үсэг, тоо, зураас (-) ашиглана. Зураасаар эхэлж, дуусахгүй";
  if (RESERVED_SLUGS.has(slug)) return "Энэ хаягийг ашиглах боломжгүй. Өөр хаяг сонгоно уу";
  return null;
}

/**
 * Давхцахгүй slug олно. `isTaken` нь өгөгдлийн сангаас шалгах функц.
 * Богино санал (suggestSlug) дээр үндэслэнэ: hatan-salon → hatan-salon-2 → hatan-salon-3 ...
 */
export async function uniqueSlug(name: string, isTaken: (slug: string) => Promise<boolean>): Promise<string> {
  let base = suggestSlug(name);
  if (base.length < 3) base = `${base || "baiguullaga"}-uvs`.replace(/^-/, "");
  if (RESERVED_SLUGS.has(base)) base = `${base}-1`;
  if (!(await isTaken(base))) return base;
  for (let i = 2; i < 100; i++) {
    const candidate = `${base}-${i}`;
    if (!(await isTaken(candidate))) return candidate;
  }
  throw new Error("Давхцахгүй хаяг олдсонгүй");
}
