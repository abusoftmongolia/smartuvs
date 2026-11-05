/**
 * GET /api/admin/stats — admin.smartuvs.mn нүүр самбарт гол тоонуудыг өгнө.
 *   Authorization: Bearer $ADMIN_API_TOKEN
 * Хувийн мэдээлэл (утас, нэр) буцаахгүй — зөвхөн нийлбэр тоо.
 */
import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { platformStats } from "@/db/admin";

export const dynamic = "force-dynamic";

function authorized(req: Request): boolean {
  const secret = process.env.ADMIN_API_TOKEN;
  if (!secret || secret.length < 24) return false;
  const given = Buffer.from(req.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export async function GET(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const s = await platformStats();
  return NextResponse.json(
    { system: "tsag", url: "https://admin.smartuvs.mn", generatedAt: new Date().toISOString(), ...s },
    { headers: { "cache-control": "no-store" } },
  );
}
