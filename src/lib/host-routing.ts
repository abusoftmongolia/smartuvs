/**
 * Нэг Next.js апп хоёр хост дээр:
 *   tsag.smartuvs.mn  → байгууллага, үйлчлүүлэгчийн хэсэг (ердийн замууд)
 *   admin.smartuvs.mn → платформын super admin (дотооддоо /platform/*)
 * Цэвэр функц — middleware.ts ашиглана (tests/host-routing.test.ts).
 */

export type HostDecision =
  | { kind: "next" }
  | { kind: "rewrite"; path: string }
  | { kind: "notFound" };

/** "admin.smartuvs.mn", "admin.localhost:3000" → админ хост */
export function isAdminHost(host: string | null, adminHost: string): boolean {
  if (!host) return false;
  const h = host.toLowerCase().split(":")[0];
  return h === adminHost.toLowerCase() || h === "admin.localhost";
}

/** Хоёр хостод ижил хэрэглэгдэх замууд (Next-ийн дотоод файл, API, зураг) */
function isShared(path: string): boolean {
  return path.startsWith("/_next/") || path.startsWith("/api/") || /\.[a-z0-9]+$/i.test(path);
}

export function routeForHost(host: string | null, path: string, adminHost: string): HostDecision {
  if (isAdminHost(host, adminHost)) {
    if (isShared(path)) return { kind: "next" };
    if (path === "/platform" || path.startsWith("/platform/")) return { kind: "next" };
    return { kind: "rewrite", path: path === "/" ? "/platform" : `/platform${path}` };
  }
  // tsag хост дээр super admin панел огт нээгдэхгүй
  if (path === "/platform" || path.startsWith("/platform/")) return { kind: "notFound" };
  return { kind: "next" };
}
