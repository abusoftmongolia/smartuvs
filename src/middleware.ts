/**
 * Хостоор ялгах: admin.smartuvs.mn → /platform/* (super admin), tsag.smartuvs.mn → ердийн.
 * Логик нь src/lib/host-routing.ts (тесттэй).
 */
import { NextResponse, type NextRequest } from "next/server";
import { routeForHost } from "@/lib/host-routing";

const ADMIN_HOST = process.env.ADMIN_HOST ?? "admin.smartuvs.mn";

export function middleware(req: NextRequest) {
  const d = routeForHost(req.headers.get("host"), req.nextUrl.pathname, ADMIN_HOST);
  if (d.kind === "notFound") return new NextResponse("Not found", { status: 404 });
  if (d.kind === "rewrite") {
    const url = req.nextUrl.clone();
    url.pathname = d.path;
    const res = NextResponse.rewrite(url);
    res.headers.set("x-robots-tag", "noindex, nofollow");
    return res;
  }
  return NextResponse.next();
}

export const config = {
  // Next-ийн статик файлаас бусад бүх замд
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
