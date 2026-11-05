/** GET /manage/<token>/ics — "Календарьт нэмэх" (утасны календарь 1 цагийн өмнө сануулна) */
import { getBookingByManageToken } from "@/db/tenant";
import { buildIcs } from "@/lib/ics";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(token)) return new Response("Not found", { status: 404 });
  const row = await getBookingByManageToken(token);
  if (!row || !["pending", "confirmed"].includes(row.booking.status)) return new Response("Not found", { status: 404 });

  const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://tsag.smartuvs.mn").replace(/\/$/, "");
  const ics = buildIcs({
    uid: `${row.booking.id}@tsag.smartuvs.mn`,
    start: row.booking.startsAt,
    end: new Date(row.booking.startsAt.getTime() + row.durationMin * 60_000),
    title: `${row.tenant.name}: ${row.serviceName}`,
    description: `Өөрчлөх, цуцлах: ${site}/manage/${token}`,
    location: row.tenant.address ?? undefined,
    url: `${site}/manage/${token}`,
    alarmMinutes: [60],
  });
  return new Response(ics, {
    headers: {
      "content-type": "text/calendar; charset=utf-8",
      "content-disposition": `attachment; filename="tsag-${row.booking.id.slice(0, 8)}.ics"`,
      "cache-control": "no-store",
      "referrer-policy": "no-referrer",
    },
  });
}
