/** Цаг захиалга системийн самбар — үзүүлэлт, хандлага, баталгаажуулах байгууллага, салбарын тархалт. */
import Link from "next/link";
import { activeTenantsByIndustry, bookingsOnDay, dailyBookings, listTenantsForAdmin, platformStats, recentActivity } from "@/db/admin";
import { getSiteConfig, isTsagMaintenance } from "@/db/platform";
import { addDays, localToUtc, todayIn } from "@/lib/time";
import { ActivityPanel } from "../Activity";
import { BarList, DailyBars, KpiGrid, Panel, pct } from "../dash";
import { fmtDate, maskPhone, TSAG } from "../fmt";
import { SystemToggle, TenantActions } from "../parts";

export default async function TsagDashboard() {
  const tz = "Asia/Ulaanbaatar";
  const today = todayIn(tz);
  const [stats, tenants, todayCount, daily, byIndustry, activity, maintenance, cfg] = await Promise.all([
    platformStats(),
    listTenantsForAdmin(),
    bookingsOnDay(localToUtc(today, 0, tz), localToUtc(addDays(today, 1), 0, tz)),
    dailyBookings(14, tz),
    activeTenantsByIndustry(),
    recentActivity(6),
    isTsagMaintenance(),
    getSiteConfig(),
  ]);
  const label = new Map(cfg.industries.map((i) => [i.id, i.label]));
  const pending = tenants.filter((t) => t.status === "pending");
  const top = tenants.filter((t) => t.status === "active" && t.bookings30d > 0).sort((a, b) => b.bookings30d - a.bookings30d).slice(0, 6);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted">Систем</p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Цаг захиалга</h1>
          <p className="mt-1 text-sm text-muted">tsag.smartuvs.mn · {maintenance ? "Засвартай" : "Идэвхтэй"}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <a href={TSAG} target="_blank" rel="noopener" className="inline-flex min-h-11 items-center rounded-xl border border-line bg-white px-4 text-sm font-semibold">Сайтыг нээх ↗</a>
          <span className="flex items-center gap-2 text-sm font-medium">
            {maintenance ? "Засвартай" : "Ажиллаж байна"}
            <SystemToggle on={!maintenance} label="Цаг захиалга" />
          </span>
        </div>
      </div>

      <KpiGrid items={[
        { label: "Идэвхтэй байгууллага", value: stats.tenants.active, sub: `Нийт ${stats.tenants.total}`, tone: "dark", href: "/tsag/tenants?status=active" },
        { label: "Хүлээгдэж буй", value: stats.tenants.pending, sub: "Баталгаажуулалт", tone: stats.tenants.pending ? "brand" : undefined, href: "/tsag/tenants?status=pending" },
        { label: "Өнөөдрийн захиалга", value: todayCount, sub: `7 хоногт ${stats.bookings.last7d}`, href: "/tsag/bookings" },
        { label: "Ирээгүй хувь", value: pct(stats.noShowRate30d), sub: `30 хоногт ${stats.bookings.last30d} захиалга` },
      ]} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_380px]">
        <Panel id="h-trend" title="Захиалгын хандлага">
          <DailyBars data={daily} caption="Сүүлийн 14 хоногийн шинэ захиалга (өдрөөр)" />
        </Panel>
        <Panel id="h-ind" title="Салбараар" action={<Link href="/tsag/categories" className="inline-flex min-h-11 items-center text-sm font-medium underline">Ангилал засах</Link>}>
          <BarList empty="Идэвхтэй байгууллага алга."
            rows={byIndustry.sort((a, b) => b.n - a.n).map((r) => ({ key: r.industry, label: label.get(r.industry) ?? r.industry, value: r.n }))} />
        </Panel>
      </div>

      <Panel id="h-pending" title={`Баталгаажуулах байгууллага${pending.length ? ` (${pending.length})` : ""}`}
        action={<Link href="/tsag/tenants?status=pending" className="inline-flex min-h-11 items-center text-sm font-medium underline">Бүгдийг харах</Link>}>
        {pending.length === 0 ? (
          <p className="rounded-2xl bg-ground p-5 text-muted">Хүлээгдэж буй бүртгэл алга. ✓</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead className="border-b border-line text-xs font-medium uppercase tracking-wider text-muted">
                <tr><th className="py-3 pr-3">Байгууллага</th><th className="px-3 py-3">Салбар</th><th className="px-3 py-3">Бүртгүүлсэн</th><th className="py-3 pl-3 text-right">Үйлдэл</th></tr>
              </thead>
              <tbody>
                {pending.slice(0, 8).map((t) => (
                  <tr key={t.id} className="border-b border-line last:border-b-0">
                    <td className="py-4 pr-3"><div className="font-medium">{t.name}</div><div className="text-sm text-muted">{t.ownerName ?? "—"} · {maskPhone(t.ownerPhone)}</div></td>
                    <td className="px-3 py-4"><span className="whitespace-nowrap rounded-lg bg-ground px-2.5 py-1 text-sm font-medium">{label.get(t.industry) ?? t.industry}</span></td>
                    <td className="px-3 py-4 tabular-nums">{fmtDate(t.createdAt)}</td>
                    <td className="py-4 pl-3"><TenantActions id={t.id} name={t.name} status={t.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Panel id="h-top" title="Идэвхтэй байгууллагууд (30 хоног)">
          <BarList empty="Сүүлийн 30 хоногт захиалга алга."
            rows={top.map((t) => ({ key: t.id, label: t.name, value: t.bookings30d, href: `${TSAG}/dashboard/${t.slug}` }))} />
        </Panel>
        <ActivityPanel items={activity} />
      </div>
    </>
  );
}
