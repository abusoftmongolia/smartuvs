/**
 * SmartUvs Super Admin — tsag систем: гол тоо, байгууллагууд, шинэ бүртгэлийг хянах, идэвхгүй болгох.
 * Дараа нь admin.smartuvs.mn нүүр самбар /api/admin/stats-аас ижил тоог татна.
 */
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { listTenantsForAdmin, platformStats } from "@/db/admin";
import { INDUSTRY_PRESETS } from "@/lib/presets";
import { requireSuperAdmin } from "@/server/auth";
import { logout } from "@/server/auth-actions";
import { TenantTable } from "./TenantTable";

export const metadata: Metadata = { title: "Super Admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const mask = (p: string | null) => (p ? `${p.slice(0, 2)}****${p.slice(-2)}` : "—");

export default async function AdminPage() {
  const admin = await requireSuperAdmin();
  const [stats, tenants] = await Promise.all([platformStats(), listTenantsForAdmin()]);
  const weekAgo = Date.now() - 7 * 24 * 3600_000;

  const tiles = [
    { label: "Байгууллага", value: stats.tenants.total, sub: `${stats.tenants.active} идэвхтэй · ${stats.tenants.suspended} хаалттай` },
    { label: "Шинэ (7 хоног)", value: stats.tenants.new7d, sub: "бүртгүүлсэн байгууллага" },
    { label: "Захиалга (24 цаг)", value: stats.bookings.last24h, sub: `7 хоногт ${stats.bookings.last7d} · 30 хоногт ${stats.bookings.last30d}` },
    {
      label: "Ирээгүй (30 хоног)",
      value: stats.noShowRate30d == null ? "—" : `${Math.round(stats.noShowRate30d * 100)}%`,
      sub: `${stats.bookings.noShow30d} ирээгүй / ${stats.bookings.attended30d} ирсэн`,
    },
    { label: "Хэрэглэгч", value: stats.users, sub: "ажилтан, эзэмшигч" },
  ];

  return (
    <div className="min-h-dvh">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Image src="/smartuvs-logo.png" alt="SmartUvs.mn" width={206} height={32} className="h-7 w-auto" priority />
            <span className="rounded-full bg-ink px-2.5 py-0.5 text-xs font-bold text-white">Super Admin · Цаг</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden text-sm font-semibold text-muted sm:inline">{admin.name}</span>
            <Link href="/dashboard" className="inline-flex min-h-11 items-center rounded-xl border border-line px-4 text-sm font-bold">Самбар</Link>
            <form action={logout}>
              <button className="inline-flex min-h-11 items-center rounded-xl border border-line px-4 text-sm font-bold">Гарах</button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6">
        <h1 className="text-2xl font-extrabold">tsag.smartuvs.mn</h1>

        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5" aria-label="Гол тоо">
          {tiles.map((t) => (
            <li key={t.label} className="flex flex-col gap-1 rounded-card border border-line bg-white p-4">
              <span className="text-[13px] font-bold text-muted">{t.label}</span>
              <span className="text-3xl font-extrabold tabular-nums">{t.value}</span>
              <span className="text-xs text-muted">{t.sub}</span>
            </li>
          ))}
        </ul>

        <TenantTable
          tenants={tenants.map((t) => ({
            id: t.id,
            slug: t.slug,
            name: t.name,
            industry: INDUSTRY_PRESETS[t.industry].label,
            status: t.status,
            address: t.address,
            createdAt: t.createdAt.toISOString().slice(0, 10),
            isNew: t.createdAt.getTime() >= weekAgo,
            owner: t.ownerName ? `${t.ownerName} · ${mask(t.ownerPhone)}` : "—",
            bookings30d: t.bookings30d,
            noShow30d: t.noShow30d,
            services: t.services,
          }))}
        />
      </main>
    </div>
  );
}
