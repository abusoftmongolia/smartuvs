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
  "smartuvs", "tsag", "ajil",
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

/**
 * Давхцахгүй slug олно. `isTaken` нь өгөгдлийн сангаас шалгах функц.
 * hatan-salon → hatan-salon-2 → hatan-salon-3 ...
 */
export async function uniqueSlug(name: string, isTaken: (slug: string) => Promise<boolean>): Promise<string> {
  let base = slugify(name);
  if (base.length < 3) base = `${base || "baiguullaga"}-uvs`.replace(/^-/, "");
  if (RESERVED_SLUGS.has(base)) base = `${base}-1`;
  if (!(await isTaken(base))) return base;
  for (let i = 2; i < 100; i++) {
    const candidate = `${base}-${i}`;
    if (!(await isTaken(candidate))) return candidate;
  }
  throw new Error("Давхцахгүй хаяг олдсонгүй");
}
