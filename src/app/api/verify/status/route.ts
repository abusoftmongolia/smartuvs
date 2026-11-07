/**
 * GET /api/verify/status — утас баталгаажуулалтын төлөв (3 сек тутмын poll).
 * Токеныг URL-д биш `x-verify-token` header-т — access log, referrer-т үлдэхгүй.
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { verificationState } from "@/server/phone-verification";

const Token = z.string().min(1).max(1024);
const headers = { "cache-control": "private, no-store" };

export async function GET(req: Request) {
  const parsed = Token.safeParse(req.headers.get("x-verify-token"));
  if (!parsed.success) return NextResponse.json({ state: "invalid" }, { headers });
  return NextResponse.json({ state: await verificationState(parsed.data) }, { headers });
}
