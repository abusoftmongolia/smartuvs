/** SQL файл ажиллуулна: tsx scripts/apply-sql.ts drizzle/custom/booking_constraints.sql */
import "dotenv/config";
import { readFileSync } from "node:fs";
import postgres from "postgres";

const file = process.argv[2];
if (!file) throw new Error("SQL файлын замыг өг");
const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL тохируулаагүй байна (.env)");

const sql = postgres(url, { prepare: false, max: 1 });
await sql.unsafe(readFileSync(file, "utf8"));
console.log(`✓ ${file} ажиллалаа`);
await sql.end();
