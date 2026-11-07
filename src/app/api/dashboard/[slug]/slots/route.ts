/**
 * GET /api/dashboard/<slug>/slots?serviceId=&date=&ownerId=&excludeBookingId=
 * Ажилтны самбарын сул цаг. Session cookie-оор гишүүн эсэхийг шалгана.
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { memberOrNull } from "@/server/auth";
import { loadDashboardSlots } from "@/server/slot-queries";

const Query = z.object({
  serviceId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  ownerId: z.string().uuid().optional(),
  excludeBookingId: z.string().uuid().optional(),
});
const noStore = { "cache-control": "private, no-store" };

export async function GET(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const parsed = Query.safeParse(Object.fromEntries(new URL(req.url).searchParams));
  if (!parsed.success) return NextResponse.json({ error: "invalid_query" }, { status: 400, headers: noStore });
  const m = await memberOrNull(slug);
  if (!m) return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: noStore });
  const slots = await loadDashboardSlots(m.tenant, { ...parsed.data, ownerId: parsed.data.ownerId ?? null });
  if (!slots) return NextResponse.json({ error: "service_not_found" }, { status: 404, headers: noStore });
  return NextResponse.json({ slots }, { headers: noStore });
}
