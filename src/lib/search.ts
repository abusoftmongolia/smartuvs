/** Нүүр хуудасны байгууллага хайлт — кирилл ба латинаар ("хатан" ба "hatan" хоёулаа олдоно). */
import { slugify } from "./slug";

export type Searchable = { name: string; slug: string; address: string | null };

function norm(s: string): string {
  return s.toLocaleLowerCase("mn").replace(/ё/g, "е").replace(/\s+/g, " ").trim();
}

export function matchesQuery(t: Searchable, query: string): boolean {
  const q = norm(query);
  if (!q) return true;
  const hay = norm(`${t.name} ${t.address ?? ""}`);
  if (hay.includes(q)) return true;
  // Латинаар бичсэн эсвэл кирилл → латин хөрвүүлгээр (slug-тай ижил дүрмээр)
  const qLatin = slugify(q).replace(/-/g, " ");
  if (!qLatin) return false;
  const hayLatin = `${slugify(t.name)} ${slugify(t.address ?? "")} ${t.slug}`.replace(/-/g, " ");
  return hayLatin.includes(qLatin);
}
