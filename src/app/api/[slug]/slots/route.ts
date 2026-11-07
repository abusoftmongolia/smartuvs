/**
 * GET /api/<slug>/slots?serviceId=...&date=YYYY-MM-DD&staffId=...(заавал биш)
 * Сул цагуудыг буцаана. Захиалгын хуудас өдөр солих бүрт дуудна.
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { getService, getTenantBySlug } from "@/db/tenant";
import { getAvailability } from "@/server/availability";

const Query = z.object({
  serviceId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  staffId: z.string().uuid().optional(),
});

export async function GET(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const parsed = Query.safeParse(Object.fromEntries(new URL(req.url).searchParams));
  if (!parsed.success) return NextResponse.json({ error: "invalid_query" }, { status: 400 });

  const tenant = await getTenantBySlug(slug);
  if (!tenant) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const service = await getService(tenant.id, parsed.data.serviceId);
  if (!service) return NextResponse.json({ error: "service_not_found" }, { status: 404 });

  const slots = await getAvailability({ tenant, service, staffId: parsed.data.staffId ?? null, date: parsed.data.date });
  return NextResponse.json(
    { date: parsed.data.date, slots: slots.map((s) => ({ label: s.label, startMin: s.startMin })) },
    { headers: { "cache-control": "no-store" } },
  );
}
