/**
 * GET /api/manage/<token>/slots?date=YYYY-MM-DD
 * Захиалгаа шилжүүлэх сул цаг. Токен = нэвтрэлт (/manage/<token>-тэй ижил).
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { loadManageSlots } from "@/server/slot-queries";

const Token = z.string().min(16).max(64).regex(/^[A-Za-z0-9_-]+$/);
const DateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const headers = { "cache-control": "private, no-store", "referrer-policy": "no-referrer", "x-robots-tag": "noindex" };

export async function GET(req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  const date = new URL(req.url).searchParams.get("date");
  if (!Token.safeParse(token).success || !DateStr.safeParse(date).success) {
    return NextResponse.json({ error: "invalid_query" }, { status: 400, headers });
  }
  try {
    const slots = await loadManageSlots(token, date!);
    if (!slots) return NextResponse.json({ error: "not_found" }, { status: 404, headers });
    return NextResponse.json({ slots }, { headers });
  } catch (err) {
    console.error("manage slots", err);
    return NextResponse.json({ error: "error" }, { status: 500, headers });
  }
}
