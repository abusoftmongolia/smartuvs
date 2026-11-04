/**
 * Туршилтын өгөгдөл: tsag.smartuvs.mn/hatan-salon (үсчин) ба tsag.smartuvs.mn/uvs-wash (авто угаалга)
 * Дахин ажиллуулахад аюулгүй — slug байвал алгасна.
 */
import "dotenv/config";
import { eq } from "drizzle-orm";
import { db, schema } from "../src/db";
import { hashPassword } from "../src/lib/password";
import { defaultSettings, INDUSTRY_PRESETS, type Industry } from "../src/lib/presets";

const { tenants, staff, services, staffServices, schedules, resources, users, memberships } = schema;

/** Демо эзэмшигч — зөвхөн хөгжүүлэлтийн санд. Production-д seed ажиллуулахгүй. */
const DEMO_PHONE = "88000001";
const DEMO_PASSWORD = process.env.SEED_DEMO_PASSWORD || "tsag-demo-2026";

// Даваа–Баасан 09:00–19:00 (13:00–14:00 завсарлага), Бямба 10:00–17:00, Ням амарна
const WEEK: { weekday: number; windows: [number, number][] }[] = [
  { weekday: 1, windows: [[540, 780], [840, 1140]] },
  { weekday: 2, windows: [[540, 780], [840, 1140]] },
  { weekday: 3, windows: [[540, 780], [840, 1140]] },
  { weekday: 4, windows: [[540, 780], [840, 1140]] },
  { weekday: 5, windows: [[540, 780], [840, 1140]] },
  { weekday: 6, windows: [[600, 1020]] },
];

async function seedTenant(p: { slug: string; name: string; industry: Industry; people: string[] }) {
  const existing = await db().select({ id: tenants.id }).from(tenants).where(eq(tenants.slug, p.slug));
  if (existing.length) {
    console.log(`• ${p.slug} аль хэдийн байна — алгаслаа`);
    return;
  }
  const preset = INDUSTRY_PRESETS[p.industry];
  const [t] = await db()
    .insert(tenants)
    .values({
      slug: p.slug,
      name: p.name,
      industry: p.industry,
      bookingMode: preset.bookingMode,
      timezone: "Asia/Hovd",
      address: "Улаангом",
      settings: defaultSettings(p.industry),
    })
    .returning();

  const svc = await db()
    .insert(services)
    .values(preset.services.map((s, i) => ({ tenantId: t.id, ...s, sortOrder: i })))
    .returning();

  if (preset.bookingMode === "resource") {
    const res = await db()
      .insert(resources)
      .values(p.people.map((name, i) => ({ tenantId: t.id, type: "bay", name, sortOrder: i })))
      .returning();
    for (const r of res) {
      await db().insert(schedules).values(
        WEEK.flatMap((d) => d.windows.map(([startMin, endMin]) => ({ tenantId: t.id, resourceId: r.id, weekday: d.weekday, startMin, endMin }))),
      );
    }
  } else {
    const st = await db()
      .insert(staff)
      .values(p.people.map((name, i) => ({ tenantId: t.id, name, title: preset.terminology.staff, sortOrder: i })))
      .returning();
    for (const s of st) {
      await db().insert(staffServices).values(svc.map((x) => ({ staffId: s.id, serviceId: x.id })));
      await db().insert(schedules).values(
        WEEK.flatMap((d) => d.windows.map(([startMin, endMin]) => ({ tenantId: t.id, staffId: s.id, weekday: d.weekday, startMin, endMin }))),
      );
    }
  }
  console.log(`✓ ${p.name} → /${p.slug}`);
}

async function seedDemoOwner(slugs: string[]) {
  const [u] = await db()
    .insert(users)
    .values({ phone: DEMO_PHONE, name: "Демо эзэмшигч", passwordHash: await hashPassword(DEMO_PASSWORD), phoneVerifiedAt: new Date() })
    .onConflictDoUpdate({ target: users.phone, set: { name: "Демо эзэмшигч" } })
    .returning();
  for (const slug of slugs) {
    const [t] = await db().select({ id: tenants.id }).from(tenants).where(eq(tenants.slug, slug));
    if (t) await db().insert(memberships).values({ userId: u.id, tenantId: t.id, role: "owner" }).onConflictDoNothing();
  }
  console.log(`✓ Демо нэвтрэлт: ${DEMO_PHONE} / ${DEMO_PASSWORD} → /login`);
}

async function main() {
  if (process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production") {
    throw new Error("Production санд демо өгөгдөл оруулахгүй");
  }
  await seedTenant({ slug: "hatan-salon", name: "Хатан Салон", industry: "barber", people: ["Болормаа", "Тэмүүлэн", "Нандин"] });
  await seedTenant({ slug: "uvs-wash", name: "Увс Авто Угаалга", industry: "carwash", people: ["Бокс 1", "Бокс 2"] });
  await seedDemoOwner(["hatan-salon", "uvs-wash"]);
}

main().then(
  () => process.exit(0),
  (e) => {
    console.error(e);
    process.exit(1);
  },
);
