/**
 * Захиалгын түүх — бүх захиалга (цуцлагдсаныг оруулаад). Код, нэр, утсаар хайх; хугацаа, төлөвөөр шүүх.
 * Мөр дээр дарахад календарь дээр тэр захиалгыг нээнэ (?code=).
 */
import Link from "next/link";
import { listBookingHistory } from "@/db/tenant";
import { formatBookingCode, normalizeBookingCode } from "@/lib/booking-code";
import { formatDayMn, formatHm, todayIn, utcToLocalMinute } from "@/lib/time";
import { requireMember } from "@/server/auth";
import { PageBody, PageHeader } from "../../PageHeader";

const STATUS = {
  pending: { label: "Хүлээгдэж буй", cls: "bg-blue-50 text-blue-800" },
  confirmed: { label: "Баталгаажсан", cls: "bg-brand-tint text-brand-deep" },
  checked_in: { label: "Ирсэн", cls: "bg-green-50 text-green-800" },
  completed: { label: "Дууссан", cls: "bg-ground text-muted" },
  cancelled: { label: "Цуцлагдсан", cls: "bg-ground text-muted line-through" },
  no_show: { label: "Ирээгүй", cls: "bg-red-50 text-red-800" },
} as const;
type Status = keyof typeof STATUS;
const PERIODS = { all: "Бүгд", upcoming: "Удахгүй", past: "Өнгөрсөн" } as const;
type Period = keyof typeof PERIODS;

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ q?: string; period?: string; status?: string }> };

export default async function HistoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { tenant } = await requireMember(slug);
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().slice(0, 60);
  const period: Period = sp.period === "upcoming" || sp.period === "past" ? sp.period : "all";
  const status = sp.status && Object.hasOwn(STATUS, sp.status) ? (sp.status as Status) : undefined;

  const digits = q.replace(/\D/g, "");
  const now = new Date();
  const rows = await listBookingHistory(tenant.id, {
    code: q ? normalizeBookingCode(q) : null,
    text: q && digits.length < 4 ? q : undefined,
    digits: digits.length >= 4 ? digits : undefined,
    status,
    fromUtc: period === "upcoming" ? now : undefined,
    toUtc: period === "past" ? now : undefined,
    limit: 100,
  });

  const tz = tenant.timezone;
  const base = `/dashboard/${slug}/history`;
  const href = (patch: Record<string, string | undefined>) => {
    const u = new URLSearchParams();
    const merged = { q: q || undefined, period: period === "all" ? undefined : period, status, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v) u.set(k, v);
    const s = u.toString();
    return s ? `${base}?${s}` : base;
  };
  const chip = (on: boolean) => `inline-flex min-h-11 items-center rounded-full border px-3.5 text-sm ${on ? "border-ink bg-ink font-medium text-white" : "border-line bg-white text-ink/80 hover:border-ink/30"}`;

  return (
    <>
      <PageHeader title="Захиалгын түүх" subtitle="Бүх захиалга — код, нэр эсвэл утасны дугаараар хайна" />
      <PageBody wide>
        <div className="flex flex-col gap-3 rounded-xl border border-line bg-white p-4">
          <form action={base} method="get" role="search" className="flex gap-2">
            {period !== "all" && <input type="hidden" name="period" value={period} />}
            {status && <input type="hidden" name="status" value={status} />}
            <label htmlFor="h-q" className="sr-only">Хайх</label>
            <input id="h-q" name="q" defaultValue={q} placeholder="Код, нэр эсвэл утас…" autoComplete="off" maxLength={60}
              className="min-h-11 min-w-0 flex-1 rounded-lg border border-line px-3 text-base outline-none focus:border-ink sm:text-sm" />
            <button className="inline-flex min-h-11 items-center rounded-lg bg-ink px-4 text-sm font-medium text-white">Хайх</button>
          </form>
          <div className="flex flex-wrap gap-2" aria-label="Хугацаа">
            {(Object.keys(PERIODS) as Period[]).map((k) => (
              <Link key={k} href={href({ period: k === "all" ? undefined : k })} aria-current={period === k ? "true" : undefined} className={chip(period === k)}>{PERIODS[k]}</Link>
            ))}
            <span aria-hidden className="mx-1 w-px self-stretch bg-line" />
            <Link href={href({ status: undefined })} aria-current={!status ? "true" : undefined} className={chip(!status)}>Бүх төлөв</Link>
            {(Object.keys(STATUS) as Status[]).map((k) => (
              <Link key={k} href={href({ status: k })} aria-current={status === k ? "true" : undefined} className={chip(status === k)}>{STATUS[k].label}</Link>
            ))}
          </div>
        </div>

        <p className="text-sm text-muted" aria-live="polite">{rows.length === 100 ? "Сүүлийн 100 захиалга" : `${rows.length} захиалга`}</p>

        {rows.length === 0 ? (
          <p className="rounded-xl border border-line bg-white p-6 text-sm text-muted">Захиалга олдсонгүй.</p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-line bg-white">
            <table className="w-full text-sm">
              <thead className="hidden border-b border-line bg-[#fafafa] text-left text-xs text-muted md:table-header-group">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Код</th>
                  <th className="px-4 py-2.5 font-medium">Огноо, цаг</th>
                  <th className="px-4 py-2.5 font-medium">Үйлчлүүлэгч</th>
                  <th className="px-4 py-2.5 font-medium">Үйлчилгээ</th>
                  <th className="px-4 py-2.5 font-medium">Төлөв</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((b) => {
                  const d = todayIn(tz, b.startsAt);
                  const m = utcToLocalMinute(b.startsAt, tz);
                  const open = `/dashboard/${slug}/calendar?code=${b.code}`;
                  return (
                    <tr key={b.id} className="relative flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 hover:bg-[#fafafa] md:table-row md:p-0">
                      <td className="font-mono text-xs text-muted md:px-4 md:py-3">
                        <Link href={open} className="after:absolute after:inset-0" aria-label={`${formatBookingCode(b.code)} захиалгыг календарьт нээх`}>{formatBookingCode(b.code)}</Link>
                      </td>
                      <td className="order-first w-full font-medium md:order-none md:w-auto md:px-4 md:py-3">{formatDayMn(d)}, {formatHm(m)}</td>
                      <td className="md:px-4 md:py-3">{b.customerName}</td>
                      <td className="text-muted md:px-4 md:py-3">{b.serviceName}</td>
                      <td className="md:px-4 md:py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS[b.status].cls}`}>{STATUS[b.status].label}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </PageBody>
    </>
  );
}
