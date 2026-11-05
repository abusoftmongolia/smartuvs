/**
 * Super admin эрх олгох / хасах (зөвхөн CLI-аар — UI-аас олгох боломжгүй):
 *   npx tsx scripts/make-super-admin.ts 99112233          # олгох
 *   npx tsx scripts/make-super-admin.ts 99112233 --revoke # хасах
 */
import "dotenv/config";
import { eq } from "drizzle-orm";
import { db, schema } from "../src/db";
import { normalizePhone } from "../src/lib/sms";

async function main() {
  const phone = normalizePhone(process.argv[2] ?? "");
  if (!phone) throw new Error("Утасны дугаар өгнө үү: npx tsx scripts/make-super-admin.ts 99112233");
  const revoke = process.argv.includes("--revoke");
  const [u] = await db()
    .update(schema.users)
    .set({ isSuperAdmin: !revoke })
    .where(eq(schema.users.phone, phone))
    .returning({ name: schema.users.name });
  if (!u) throw new Error("Энэ дугаараар хэрэглэгч олдсонгүй. Эхлээд /signup-аар бүртгүүлнэ үү.");
  console.log(`✓ ${u.name}: super admin ${revoke ? "хасагдлаа" : "боллоо"}`);
}

main().then(() => process.exit(0), (e) => { console.error(e.message ?? e); process.exit(1); });
