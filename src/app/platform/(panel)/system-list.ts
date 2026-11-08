/** SmartUvs-ийн дэд системүүд — Super Admin-ы систем сонголт, самбарт. Шинэ систем холбогдоход энд нэмнэ. */
export type SystemKey = "tsag" | "chat" | "ajil";

export const SYSTEMS: { key: SystemKey; name: string; host: string; href: string | null; note: string }[] = [
  { key: "tsag", name: "Цаг захиалга", host: "tsag.smartuvs.mn", href: "/tsag", note: "Идэвхтэй" },
  { key: "chat", name: "Ухаалаг туслах", host: "chat.smartuvs.mn", href: null, note: "Холбогдоогүй" },
  { key: "ajil", name: "Цагийн ажил", host: "ajil.smartuvs.mn", href: null, note: "Хөгжүүлэлтэд" },
];

/** "/tsag/tenants" → "tsag"; платформын түвшний хуудсанд null */
export function systemOfPath(path: string): SystemKey | null {
  const s = SYSTEMS.find((x) => x.href && (path === x.href || path.startsWith(`${x.href}/`)));
  return s?.key ?? null;
}
