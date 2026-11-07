/**
 * Хянах самбар — өнөөдрийн тойм: тоон үзүүлэлт, өнөөдрийн хуваарь, батлах хүлээж буй.
 * /dashboard/<slug>
 */
import Link from "next/link";
import { redirect } from "next/navigation";
import { listBookingsInRange, listPendingBookings } from "@/db/tenant";
import { countRows, formatPercent, noShowRate } from "@/lib/report";
import { addDays, formatDayMn, formatHm, localToUtc, todayIn, utcToLocalMinute } from "@/lib/time";
import { requireMember } from "@/server/auth";
import { PageBody, PageHeader, Panel } from "../PageHeader";

const STATUS = {
  pending: { label: "Хүлээгдэж буй", cls: "bg-blue-50 text-blue-800" },
  confirmed: { label: "Баталгаажсан", cls: "bg-brand-tint text-brand-deep" },
  checked_in: { label: "Ирсэн", cls: "bg-green-50 text-green-800" },
  completed: { label: "Дууссан", cls: "bg-ground text-muted" },
  cancelled: { label: "Цуцлагдсан", cls: "bg-ground text-muted" },
  no_show: { label: "Ирээгүй", cls: "bg-red-50 text-red-800" },
} as const;

export default async function Overview({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ date?: string; code?: string }> }) {
  const { slug } = await params;
  // Хуучин холбоос (/dashboard/<slug>?date=… эсвэл ?code=…) → календарь
  const sp = await searchParams;
  if (sp.date || sp.code) redirect(`/dashboard/${slug}/calendar?${new URLSearchParams(Object.entries(sp).filter(([, v]) => typeof v === "string") as [string, string][])}`);
  const { tenant, role } = await requireMember(slug);
  const tz = tenant.timezone;
  const today = todayIn(tz);
  const monthStart = `${today.slice(0, 8)}01`;
  const now = new Date();

  const [todayList, week, month, pending] = await Promise.all([
    listBookingsInRange(tenant.id, localToUtc(today, 0, tz), localToUtc(addDays(today, 1), 0, tz)),
    listBookingsInRange(tenant.id, localToUtc(today, 0, tz), localToUtc(addDays(today, 7), 0, tz)),
    listBookingsInRange(tenant.id, localToUtc(monthStart, 0, tz), now),
    listPendingBookings(tenant.id),
  ]);

  // Энэ сарын ирээгүй хувь — тайлантай ижил тооцоо (ирээгүй / тэмдэглэсэн)
  const monthCounts = countRows(month, now);
  const marked = monthCounts.attended + monthCounts.noShow;
  const rate = noShowRate(monthCounts);

  const base = `/dashboard/${slug}`;
  const canManage = role === "owner" || role === "manager";
  const stats = [
    { label: "Өнөөдөр", value: String(todayList.length), sub: "захиалга", href: `${base}/calendar` },
    { label: "Хүлээгдэж буй", value: String(pending.length), sub: "батлах шаардлагатай", href: `${base}/pending`, alert: pending.length > 0 },
    { label: "Ирэх 7 хоног", value: String(week.length), sub: "захиалга", href: `${base}/calendar` },
    { label: "Ирээгүй (энэ сар)", value: formatPercent(rate), sub: rate == null ? "өгөгдөл алга" : `${monthCounts.noShow} / ${marked}`, href: canManage ? `${base}/reports` : `${base}/history?status=no_show` },
  ];

  return (
    <>
      <PageHeader title="Хянах самбар" subtitle={`${tenant.name} · ${formatDayMn(today)}`}>
        <Link href={`${base}/calendar`} className="inline-flex min-h-11 items-center rounded-lg bg-brand px-4 text-sm font-semibold text-ink">Календарь нээх</Link>
      </PageHeader>
      <PageBody>
        {tenant.status !== "active" && (
          <p role="status" className="rounded-xl border border-brand bg-brand-tint p-4 text-sm">
            {tenant.status === "pending"
              ? <><b className="font-semibold">Таны байгууллага хянагдаж байна.</b> Батлагдмагц захиалгын хуудас нээгдэж, танд SMS ирнэ. Энэ хооронд үйлчилгээ, ажлын цагаа тохируулж болно.</>
              : tenant.status === "rejected"
                ? <><b className="font-semibold">Бүртгэл батлагдаагүй.</b> Дэлгэрэнгүйг SmartUvs-ээс лавлана уу.</>
                : <><b className="font-semibold">Байгууллага түр хаагдсан.</b> Захиалгын хуудас нийтэд харагдахгүй байна.</>}
          </p>
        )}

        <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map((s) => (
            <li key={s.label}>
              <Link href={s.href} className={`flex h-full flex-col gap-1 rounded-xl border bg-white p-4 transition hover:border-ink/25 ${s.alert ? "border-pending/40" : "border-line"}`}>
                <span className="text-xs font-medium text-muted">{s.label}</span>
                <span className={`text-2xl font-semibold tabular-nums ${s.alert ? "text-pending" : ""}`}>{s.value}</span>
                <span className="text-xs text-muted">{s.sub}</span>
              </Link>
            </li>
          ))}
        </ul>

        <div className="grid items-start gap-5 lg:grid-cols-[1.6fr_1fr]">
          <Panel title="Өнөөдрийн хуваарь" subtitle={todayList.length ? `${todayList.length} захиалга` : undefined}>
            {todayList.length === 0 ? (
              <p className="text-sm text-muted">Өнөөдөр захиалга алга.</p>
            ) : (
              <ul className="-mx-2 flex flex-col">
                {todayList.map((b) => {
                  const m = utcToLocalMinute(b.startsAt, tz);
                  return (
                    <li key={b.id}>
                      <Link href={`${base}/calendar?code=${b.code}`} className="flex min-h-12 items-center gap-3 rounded-lg px-2 py-2 hover:bg-[#fafafa]">
                        <span className="w-12 flex-none text-sm font-semibold tabular-nums">{formatHm(m)}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">{b.customerName}</span>
                          <span className="block truncate text-xs text-muted">{b.serviceName}</span>
                        </span>
                        <span className={`flex-none rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS[b.status].cls}`}>{STATUS[b.status].label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>

          <div className="flex flex-col gap-5">
            <Panel title="Батлах хүлээж буй">
              {pending.length === 0 ? (
                <p className="text-sm text-muted">Бүгд шийдэгдсэн. ✓</p>
              ) : (
                <>
                  <ul className="flex flex-col gap-2">
                    {pending.slice(0, 3).map((b) => {
                      const d = todayIn(tz, b.startsAt);
                      return (
                        <li key={b.id} className="rounded-lg bg-[#fafafa] px-3 py-2 text-sm">
                          <span className="font-medium">{b.customerName}</span>
                          <span className="block text-xs text-muted">{formatDayMn(d)}, {formatHm(utcToLocalMinute(b.startsAt, tz))} · {b.serviceName}</span>
                        </li>
                      );
                    })}
                  </ul>
                  <Link href={`${base}/pending`} className="inline-flex min-h-11 items-center justify-center rounded-lg border border-line text-sm font-medium">
                    Бүгдийг харах ({pending.length})
                  </Link>
                </>
              )}
            </Panel>
            <Panel title="Захиалгын холбоос">
              <a href={`/${slug}`} target="_blank" className="break-all text-sm font-medium text-brand-deep underline">tsag.smartuvs.mn/{slug}</a>
              {canManage && (
                <Link href={`${base}/share`} className="inline-flex min-h-11 items-center justify-center rounded-lg border border-line text-sm font-medium">QR код, постер</Link>
              )}
            </Panel>
          </div>
        </div>
      </PageBody>
    </>
  );
}
