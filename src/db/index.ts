import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

type Db = ReturnType<typeof drizzle<typeof schema>>;

let _db: Db | undefined;

/** Lazy холболт — build хийх үед DATABASE_URL шаардахгүй. */
export function db(): Db {
  if (_db) return _db;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL тохируулаагүй байна (.env)");
  // prepare: false — Neon/Supabase-ийн pooled (pgbouncer) холболттой ажиллана
  const client = postgres(url, { prepare: false, max: 5 });
  _db = drizzle(client, { schema });
  return _db;
}

export { schema };

/** Postgres exclusion_violation — давхар захиалга */
export const PG_EXCLUSION_VIOLATION = "23P01";
/** Postgres unique_violation */
export const PG_UNIQUE_VIOLATION = "23505";

export function pgErrorCode(err: unknown): string | undefined {
  const e = err as { code?: string; cause?: { code?: string } };
  return e?.code ?? e?.cause?.code;
}
