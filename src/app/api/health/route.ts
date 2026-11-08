/**
 * GET /api/health — uptime monitor-т. DB холболт ба production тохиргооны дутууг (зөвхөн нэр) буцаана.
 * DB эсвэл тохиргоо дутуу бол 503.
 */
import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { productionEnvProblems } from "@/lib/env-check";

export const dynamic = "force-dynamic";

export async function GET() {
  const started = Date.now();
  let dbOk = false;
  try {
    await db().execute(sql`select 1`);
    dbOk = true;
  } catch (e) {
    console.error("health db", e instanceof Error ? e.message : e);
  }
  const config = process.env.NODE_ENV === "production" ? productionEnvProblems() : [];
  const ok = dbOk && config.length === 0;
  return NextResponse.json(
    { ok, db: dbOk ? "ok" : "error", dbMs: Date.now() - started, config },
    { status: ok ? 200 : 503, headers: { "cache-control": "no-store" } },
  );
}
