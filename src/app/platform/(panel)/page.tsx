/**
 * Платформын тойм — SmartUvs Super Admin (загвар: админ панел UI).
 * Одоогоор зөвхөн tsag систем холбогдсон; chat, ajil нь "холбогдоогүй" гэж харагдана.
 */
import Link from "next/link";
import { bookingsOnDay, listTenantsForAdmin, platformStats, recentActivity } from "@/db/admin";
import { isTsagMaintenance } from "@/db/platform";
import { INDUSTRY_PRESETS } from "@/lib/presets";
import { addDays, localToUtc, todayIn } from "@/lib/time";
import { ago, fmtDate, maskPhone } from "./fmt";
import { TenantActions } from "./parts";
import { SystemsCard } from "./Systems";

const ACTIVITY: Record<string, (a: { tenantName: string | null; actorName: string | null }) => string> = {
  "tenant.create": (a) => `Шинэ байгууллага бүртгэл илгээв — ${a.tenantName ?? "?"} · tsag.smartuvs.mn`,
  signup: (a) => `Шинэ хэрэглэгч бүртгүүлэв — ${a.actorName ?? "?"}`,
  "tenant.approve": (a) => `${a.tenantName ?? "?"} батлагдав`,
  "tenant.reject": (a) => `${a.tenantName ?? "?"}-ийн бүртгэлээс татгалзав`,
  "tenant.suspend": (a) => `${a.tenantName ?? "?"} хаагдав`,
  "tenant.activate": (a) => `${a.tenantName ?? "?"} дахин нээгдэв`,
  "maintenance.on": () => "Цаг захиалга засварын горимд орлоо",
  "maintenance.off": () => "Цаг захиалга засвараас гарлаа",
};

export default async function AdminOverview({ searchParams }: { searchParams: Promise<{ system?: string }> }) {
  const { system } = await searchParams;
  const tz = "Asia/Ulaanbaatar";
  const today = todayIn(tz);
  const [stats, tenants, todayCount, activity, maintenance] = await Promise.all([
    platformStats(),
    listTenantsForAdmin(),
    bookingsOnDay(localToUtc(today, 0, tz), localToUtc(addDays(today, 1), 0, tz)),
    recentActivity(10),
    isTsagMaintenance(),
  ]);
  const pending = tenants.filter((t) => t.status === "pending");

  const cards = [
    { label: "Хэрэглэгч", value: stats.users, sub: `Энэ сард +${stats.usersNew30d}`, dark: true },
    { label: "Байгууллага", value: stats.tenants.total, sub: `${stats.tenants.pending} баталгаажуулалт хүлээж буй` },
    { label: "Өнөөдрийн захиалга", value: todayCount, sub: "tsag.smartuvs.mn" },
    ...(system === "tsag" ? [] : [{ label: "Туслахын асуулт", value: "—", sub: "chat.smartuvs.mn · холбогдоогүй" }]),
  ];

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Платформын тойм</h1>
          <p className="mt-1 text-sm text-muted">{system === "tsag" ? "Цаг захиалга системийн хяналт" : "Бүх дэд системийн нэгдсэн хяналт"}</p>
        </div>
        <span title="Дараагийн систем холбогдоход идэвхжинэ"
          className="inline-flex min-h-12 cursor-not-allowed items-center gap-2 rounded-2xl bg-ink px-5 font-semibold text-white opacity-60" aria-disabled>
          + Шинэ систем нэмэх
        </span>
      </div>

      <ul className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${cards.length === 4 ? "xl:grid-cols-4" : "xl:grid-cols-3"}`} aria-label="Гол тоо">
        {cards.map((c) => (
          <li key={c.label} className={`flex flex-col gap-2 rounded-[22px] p-6 ${c.dark ? "bg-ink text-white" : "border border-line bg-white"}`}>
            <span className={`text-sm font-medium ${c.dark ? "text-white/80" : "text-muted"}`}>{c.label}</span>
            <span className="text-5xl font-bold tabular-nums tracking-tight">{c.value}</span>
            <span className={`text-sm font-medium ${c.dark ? "text-brand" : "text-muted"}`}>{c.sub}</span>
          </li>
        ))}
      </ul>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_400px]">
        <section aria-labelledby="h-pending" className="flex min-w-0 flex-col gap-4 rounded-[22px] border border-line bg-white p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="h-pending" className="flex items-center gap-2 text-xl font-bold">
              Баталгаажуулах байгууллага
              {pending.length > 0 && <span className="flex min-w-7 items-center justify-center rounded-full bg-brand px-2 text-sm font-medium text-ink">{pending.length}</span>}
            </h2>
            <Link href="/tenants?status=pending" className="inline-flex min-h-11 items-center font-medium underline">Бүгдийг харах</Link>
          </div>
          {pending.length === 0 ? (
            <p className="rounded-2xl bg-ground p-5 text-muted">Хүлээгдэж буй бүртгэл алга. ✓</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="border-b border-line text-xs font-medium uppercase tracking-wider text-muted">
                  <tr>
                    <th className="py-3 pr-3">Байгууллага</th>
                    <th className="px-3 py-3">Төрөл</th>
                    <th className="px-3 py-3">Систем</th>
                    <th className="px-3 py-3">Бүртгүүлсэн</th>
                    <th className="py-3 pl-3 text-right">Үйлдэл</th>
                  </tr>
                </thead>
                <tbody>
                  {pending.slice(0, 8).map((t) => (
                    <tr key={t.id} className="border-b border-line last:border-b-0">
                      <td className="py-4 pr-3">
                        <div className="font-medium">{t.name}</div>
                        <div className="text-sm text-muted">{t.ownerName ?? "—"} · {maskPhone(t.ownerPhone)}</div>
                      </td>
                      <td className="px-3 py-4">
                        <span className="whitespace-nowrap rounded-lg bg-ground px-2.5 py-1 text-sm font-medium">{INDUSTRY_PRESETS[t.industry].label}</span>
                      </td>
                      <td className="px-3 py-4">tsag</td>
                      <td className="px-3 py-4 tabular-nums">{fmtDate(t.createdAt)}</td>
                      <td className="py-4 pl-3"><TenantActions id={t.id} name={t.name} status={t.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <SystemsCard tsagMaintenance={maintenance} />
      </div>

      <section aria-labelledby="h-activity" className="flex flex-col gap-2 rounded-[22px] border border-line bg-white p-6">
        <h2 id="h-activity" className="pb-2 text-xl font-bold">Сүүлийн үйл ажиллагаа</h2>
        {activity.length === 0 ? (
          <p className="text-muted">Одоогоор үйл ажиллагаа алга.</p>
        ) : (
          <ul>
            {activity.map((a, i) => (
              <li key={i} className="flex items-center gap-3 border-b border-line py-3.5 last:border-b-0">
                <span aria-hidden className="size-2.5 flex-none rounded-full bg-ink" />
                <span className="min-w-0 flex-1">{ACTIVITY[a.action]?.(a) ?? a.action}</span>
                <span className="whitespace-nowrap text-sm text-muted">{ago(a.at)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
