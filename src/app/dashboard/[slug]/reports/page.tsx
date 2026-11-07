/**
 * Тайлан — сарын захиалгын тоо, өдөр тус бүрээр, ирээгүй хувь, үйлчилгээ/ажилтнаар.
 * /dashboard/<slug>/reports?month=YYYY-MM  (manager+ эрх)
 */
import Link from "next/link";
import { listAllOwners, listBookingsForReport } from "@/db/tenant";
import { buildMonthReport, formatPercent, parseMonth, type GroupCount } from "@/lib/report";
import { addMonths, formatDateMn, formatMonthMn, localToUtc, todayIn, weekdayName } from "@/lib/time";
import { PageBody, PageHeader, Panel } from "../../PageHeader";
import { manageContext } from "../settings/data";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ month?: string }> };

export default async function ReportsPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { tenant, kind, term } = await manageContext(slug);
  const tz = tenant.timezone;
  const today = todayIn(tz);
  const thisMonth = today.slice(0, 7);
  const month = parseMonth((await searchParams).month, thisMonth);
  const next = addMonths(month, 1);

  const [rows, owners] = await Promise.all([
    listBookingsForReport(tenant.id, localToUtc(`${month}-01`, 0, tz), localToUtc(`${next}-01`, 0, tz)),
    listAllOwners(tenant.id, kind),
  ]);
  const report = buildMonthReport(
    rows.map((r) => ({ startsAt: r.startsAt, status: r.status, serviceName: r.serviceName, ownerId: kind === "resource" ? r.resourceId : r.staffId })),
    {
      month,
      timeZone: tz,
      now: new Date(),
      ownerNames: Object.fromEntries(owners.map((o) => [o.id, o.name])),
      unassignedLabel: "Хуваарилаагүй",
    },
  );
  const c = report.counts;
  const base = `/dashboard/${slug}/reports`;
  const history = `/dashboard/${slug}/history`;
  const maxDay = Math.max(1, ...report.days.map((d) => d.total));
  const marked = c.attended + c.noShow;

  const stats = [
    { label: "Нийт захиалга", value: String(c.total), sub: c.cancelled ? `+ ${c.cancelled} цуцлагдсан` : "цуцлагдсанаас бусад" },
    { label: "Ирсэн", value: String(c.attended), sub: "ирсэн, дууссан" },
    { label: "Ирээгүй", value: formatPercent(report.noShowRate), sub: marked ? `${c.noShow} / ${marked} тэмдэглэснээс` : "тэмдэглэсэн захиалга алга", alert: (report.noShowRate ?? 0) >= 0.15 },
    { label: "Хамгийн их", value: report.busiest ? String(report.busiest.total) : "—", sub: report.busiest ? `${formatDateMn(report.busiest.date)}, ${weekdayName(report.busiest.date)}` : "захиалга алга" },
  ];

  return (
    <>
      <PageHeader title="Тайлан" subtitle={`${formatMonthMn(month)} · өдөр бүрийн захиалга, ирээгүй хувь`}>
        <nav aria-label="Сар сонгох" className="flex items-center gap-2">
          <Link href={`${base}?month=${addMonths(month, -1)}`} className="inline-flex min-h-11 items-center rounded-lg border border-line bg-white px-3.5 text-sm font-medium">
            ← Өмнөх сар
          </Link>
          {month !== thisMonth && (
            <Link href={base} className="inline-flex min-h-11 items-center rounded-lg border border-line bg-white px-3.5 text-sm font-medium">Энэ сар</Link>
          )}
          {month < thisMonth && (
            <Link href={`${base}?month=${next}`} className="inline-flex min-h-11 items-center rounded-lg border border-line bg-white px-3.5 text-sm font-medium">
              Дараагийн сар →
            </Link>
          )}
        </nav>
      </PageHeader>
      <PageBody>
        <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map((s) => (
            <li key={s.label} className={`flex flex-col gap-1 rounded-xl border bg-white p-4 ${s.alert ? "border-red-300" : "border-line"}`}>
              <span className="text-xs font-medium text-muted">{s.label}</span>
              <span className={`text-2xl font-semibold tabular-nums ${s.alert ? "text-red-800" : ""}`}>{s.value}</span>
              <span className="text-xs text-muted">{s.sub}</span>
            </li>
          ))}
        </ul>

        {c.unmarked > 0 && (
          <p role="status" className="rounded-xl border border-brand bg-brand-tint p-4 text-sm">
            <b className="font-semibold">{c.unmarked} өнгөрсөн захиалгад ирсэн эсэхийг тэмдэглээгүй байна.</b>{" "}
            Ирээгүй хувь зөв гарахын тулд календарь дээр “Ирсэн” / “Ирээгүй” гэж тэмдэглээрэй.{" "}
            <Link href={`${history}?period=past&status=confirmed`} className="font-medium underline">Жагсаалт харах</Link>
          </p>
        )}

        <Panel title="Өдөр тус бүрээр" subtitle={`${formatMonthMn(month)} · нийт ${c.total} захиалга`} id="h-days">
          {c.total === 0 && c.cancelled === 0 ? (
            <p className="text-sm text-muted">Энэ сард захиалга алга.</p>
          ) : (
            <div className="-mx-2 overflow-x-auto">
              <table className="w-full min-w-[480px] text-left text-sm">
                <caption className="sr-only">{formatMonthMn(month)}-ын өдөр бүрийн захиалгын тоо</caption>
                <thead className="text-xs font-medium text-muted">
                  <tr>
                    <th scope="col" className="px-2 py-2">Өдөр</th>
                    <th scope="col" className="px-2 py-2">Захиалга</th>
                    <th scope="col" className="px-2 py-2 text-right">Ирээгүй</th>
                    <th scope="col" className="px-2 py-2 text-right">Цуцалсан</th>
                  </tr>
                </thead>
                <tbody>
                  {report.days.map((d) => {
                    const empty = d.total === 0 && d.cancelled === 0;
                    const isToday = d.date === today;
                    return (
                      <tr key={d.date} className={`border-t border-line ${empty ? "text-muted" : ""}`}>
                        <th scope="row" className="whitespace-nowrap px-2 py-1.5 font-normal tabular-nums">
                          <Link href={`/dashboard/${slug}/calendar?date=${d.date}`} className="inline-flex min-h-11 items-center hover:underline">
                            {formatDateMn(d.date).slice(5)} <span className="ml-1.5 w-8 text-muted">{weekdayName(d.date, true)}</span>
                            {isToday && <span className="ml-1 rounded bg-brand px-1.5 text-xs font-medium text-ink">Өнөөдөр</span>}
                          </Link>
                        </th>
                        <td className="w-full px-2 py-1.5">
                          <div className="flex items-center gap-2">
                            <span aria-hidden className="h-3 rounded-sm bg-brand" style={{ width: `${(d.total / maxDay) * 100}%`, minWidth: d.total ? 4 : 0 }} />
                            <span className="tabular-nums">{d.total}</span>
                          </div>
                        </td>
                        <td className={`px-2 py-1.5 text-right tabular-nums ${d.noShow ? "font-medium text-red-800" : ""}`}>{d.noShow || "—"}</td>
                        <td className="px-2 py-1.5 text-right tabular-nums">{d.cancelled || "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <div className="grid items-start gap-5 lg:grid-cols-2">
          <Breakdown title="Үйлчилгээгээр" rows={report.byService} />
          <Breakdown title={`${term} тус бүрээр`} rows={report.byOwner} />
        </div>
      </PageBody>
    </>
  );
}

function Breakdown({ title, rows }: { title: string; rows: GroupCount[] }) {
  return (
    <Panel title={title}>
      {rows.length === 0 ? (
        <p className="text-sm text-muted">Өгөгдөл алга.</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead className="text-xs font-medium text-muted">
            <tr>
              <th scope="col" className="py-2 pr-2">Нэр</th>
              <th scope="col" className="px-2 py-2 text-right">Захиалга</th>
              <th scope="col" className="py-2 pl-2 text-right">Ирээгүй</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((g) => (
              <tr key={g.key} className="border-t border-line">
                <th scope="row" className="py-2 pr-2 font-normal">{g.label}</th>
                <td className="px-2 py-2 text-right tabular-nums">{g.total}</td>
                <td className={`py-2 pl-2 text-right tabular-nums ${g.noShow ? "font-medium text-red-800" : ""}`}>{g.noShow || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Panel>
  );
}
