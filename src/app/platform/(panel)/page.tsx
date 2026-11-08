/**
 * Хяналтын самбар — SmartUvs платформын нийт үзүүлэлт (бүх дэд систем).
 * Системийн дэлгэрэнгүй удирдлага: картын "Удирдах →" (жишээ нь /tsag).
 * Одоогоор зөвхөн tsag холбогдсон; chat, ajil нь "холбогдоогүй" гэж харагдана.
 */
import Link from "next/link";
import { bookingsAllTime, bookingsOnDay, dailyBookings, platformStats, recentActivity } from "@/db/admin";
import { isTsagMaintenance } from "@/db/platform";
import { addDays, localToUtc, todayIn } from "@/lib/time";
import { ActivityPanel } from "./Activity";
import { DailyBars, KpiGrid, Panel, pct } from "./dash";
import { SYSTEMS } from "./system-list";

const nf = new Intl.NumberFormat("en-US");

export default async function AdminDashboard() {
  const tz = "Asia/Ulaanbaatar";
  const today = todayIn(tz);
  const [stats, allTime, todayCount, daily, activity, maintenance] = await Promise.all([
    platformStats(),
    bookingsAllTime(),
    bookingsOnDay(localToUtc(today, 0, tz), localToUtc(addDays(today, 1), 0, tz)),
    dailyBookings(14, tz),
    recentActivity(8),
    isTsagMaintenance(),
  ]);
  const t = stats.tenants;

  return (
    <>
      <div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Хяналтын самбар</h1>
        <p className="mt-1 text-sm text-muted">SmartUvs платформын бүх системийн нийт үзүүлэлт</p>
      </div>

      {t.pending > 0 && (
        <Link href="/tsag/tenants?status=pending"
          className="flex min-h-12 items-center gap-3 rounded-2xl border border-brand/50 bg-brand-tint px-4 py-3 text-sm font-medium sm:text-base">
          <span className="flex min-w-7 items-center justify-center rounded-full bg-brand px-2 font-semibold text-ink">{t.pending}</span>
          байгууллага баталгаажуулалт хүлээж байна
          <span aria-hidden className="ml-auto">→</span>
        </Link>
      )}

      <KpiGrid items={[
        { label: "Нийт хэрэглэгч", value: nf.format(stats.users), sub: `30 хоногт +${stats.usersNew30d}`, tone: "dark", href: "/users" },
        { label: "Идэвхтэй байгууллага", value: nf.format(t.active), sub: `Нийт ${t.total} · 7 хоногт +${t.new7d}`, href: "/tsag/tenants?status=active" },
        { label: "Нийт захиалга", value: nf.format(allTime), sub: "Бүх цаг үеийн", href: "/tsag/bookings" },
        { label: "Өнөөдрийн захиалга", value: nf.format(todayCount), sub: "Өнөөдөр болох цаг" },
        { label: "7 хоногийн захиалга", value: nf.format(stats.bookings.last7d), sub: `Сүүлийн 24 цагт ${stats.bookings.last24h}` },
        { label: "30 хоногийн захиалга", value: nf.format(stats.bookings.last30d), sub: "Шинээр үүссэн" },
        { label: "Ирээгүй хувь", value: pct(stats.noShowRate30d), sub: "Сүүлийн 30 хоног" },
        { label: "Хаагдсан байгууллага", value: t.suspended, sub: "Түр хаасан" },
      ]} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_380px]">
        <Panel id="h-trend" title="Захиалгын хандлага">
          <DailyBars data={daily} caption="Сүүлийн 14 хоногийн шинэ захиалга (өдрөөр)" />
        </Panel>

        <Panel id="h-systems" title="Дэд системүүд" action={<Link href="/systems" className="inline-flex min-h-11 items-center text-sm font-medium underline">Бүгд</Link>}>
          <ul className="flex flex-col gap-2.5">
            {SYSTEMS.map((s) => {
              const live = s.key === "tsag" && !maintenance;
              const state = s.key === "tsag" ? (maintenance ? "Засвартай" : `${t.active} байгууллага · өнөөдөр ${todayCount}`) : s.note;
              const inner = (
                <>
                  <span aria-hidden className={`size-2.5 flex-none rounded-full ${live ? "bg-green-600" : s.href ? "bg-brand" : "bg-muted/50"}`} />
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">{s.name}</span>
                    <span className="block truncate text-sm text-muted">{s.host} · {state}</span>
                  </span>
                  {s.href
                    ? <span className="inline-flex min-h-10 flex-none items-center rounded-xl bg-ink px-3 text-sm font-semibold text-white">Удирдах →</span>
                    : <span className="flex-none text-xs font-medium uppercase text-muted">удахгүй</span>}
                </>
              );
              return (
                <li key={s.key}>
                  {s.href
                    ? <Link href={s.href} className="flex items-center gap-3 rounded-2xl bg-ground p-3.5 transition hover:bg-line/60">{inner}</Link>
                    : <div className="flex items-center gap-3 rounded-2xl bg-ground p-3.5 opacity-75">{inner}</div>}
                </li>
              );
            })}
          </ul>
        </Panel>
      </div>

      <ActivityPanel items={activity} />
    </>
  );
}
