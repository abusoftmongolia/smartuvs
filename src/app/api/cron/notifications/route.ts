/**
 * Хуваарьт мэдэгдэл илгээх cron endpoint. 5 минут тутам дуудна:
 *   curl -H "Authorization: Bearer $CRON_SECRET" https://tsag.smartuvs.mn/api/cron/notifications
 * AWS: EventBridge Scheduler (API destination) эсвэл серверийн crontab.
 */
import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { runDueNotifications } from "@/server/notify-job";

export const dynamic = "force-dynamic";

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret || secret.length < 16) return false;
  const given = Buffer.from(req.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

async function handle(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const result = await runDueNotifications();
    return NextResponse.json(result, { headers: { "cache-control": "no-store" } });
  } catch (e) {
    console.error("cron/notifications", e);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}

export const GET = handle;
export const POST = handle;
