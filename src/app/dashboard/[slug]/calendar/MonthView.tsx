/**
 * Сарын календарь — 7 багана (Даваа → Ням), өдөр бүрт захиалгын тоо ба эхний хэдэн захиалга.
 * Өдөр дээр дарахад тэр өдрийн дэлгэрэнгүй (ажилтнаар баганалсан) календарь нээгдэнэ.
 */
import Link from "next/link";
import { addMonths, daysOfMonth, formatHm, formatMonthMn, weekdayOf } from "@/lib/time";

export type MonthItem = { id: string; date: string; startMin: number; name: string; status: string };

const WEEK = ["Да", "Мя", "Лх", "Пү", "Ба", "Бя", "Ня"];
const DOT: Record<string, string> = {
  pending: "bg-pending",
  confirmed: "bg-brand",
  checked_in: "bg-green-600",
  completed: "bg-muted/50",
  no_show: "bg-red-500",
};
const SHOW = 3;

export function MonthView({ base, month, today, items }: { base: string; month: string; today: string; items: MonthItem[] }) {
  const days = daysOfMonth(month);
  const lead = (weekdayOf(days[0]) + 6) % 7; // Даваа = 0
  const cells: (string | null)[] = [...Array(lead).fill(null), ...days];
  while (cells.length % 7) cells.push(null);

  const byDay = new Map<string, MonthItem[]>();
  for (const it of items) byDay.set(it.date, [...(byDay.get(it.date) ?? []), it]);
  const thisMonth = today.slice(0, 7);
  const nav = (m: string) => `${base}?view=month&month=${m}`;

  return (
    <section aria-labelledby="h-month" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <h2 id="h-month" className="mr-auto text-lg font-semibold">
          {formatMonthMn(month)}
          <span className="ml-2 text-sm font-medium text-muted">{items.length} захиалга</span>
        </h2>
        <Link href={nav(addMonths(month, -1))} aria-label="Өмнөх сар" className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-line bg-white text-sm font-medium">‹</Link>
        {month !== thisMonth && <Link href={nav(thisMonth)} className="inline-flex min-h-11 items-center rounded-xl border border-line bg-white px-4 text-sm font-medium">Энэ сар</Link>}
        <Link href={nav(addMonths(month, 1))} aria-label="Дараагийн сар" className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-line bg-white text-sm font-medium">›</Link>
      </div>

      <div className="overflow-hidden rounded-xl border border-line bg-white">
        <div className="grid grid-cols-7 border-b border-line bg-[#fafafa]" aria-hidden>
          {WEEK.map((w, i) => (
            <div key={w} className={`px-2 py-2 text-center text-xs font-medium sm:text-left ${i >= 5 ? "text-muted" : "text-ink/70"}`}>{w}</div>
          ))}
        </div>
        <ol className="grid grid-cols-7">
          {cells.map((d, i) => {
            const border = `${i % 7 !== 6 ? "border-r" : ""} ${i < cells.length - 7 ? "border-b" : ""} border-line`;
            if (!d) return <li key={`x${i}`} aria-hidden className={`min-h-16 bg-[#fafafa] sm:min-h-28 ${border}`} />;
            const list = (byDay.get(d) ?? []).sort((a, b) => a.startMin - b.startMin);
            const isToday = d === today;
            const num = Number(d.slice(8));
            return (
              <li key={d} className={border}>
                <Link href={`${base}?date=${d}`}
                  aria-label={`${d.replaceAll("-", ".")}: ${list.length ? `${list.length} захиалга` : "захиалгагүй"}`}
                  className="flex h-full min-h-16 flex-col gap-1 p-1.5 transition hover:bg-[#fafafa] sm:min-h-28 sm:p-2">
                  <span className="flex items-center justify-between gap-1">
                    <span className={`flex size-7 items-center justify-center rounded-full text-sm tabular-nums ${isToday ? "bg-brand font-semibold text-ink" : "font-medium"}`}>{num}</span>
                    {list.length > 0 && <span className="rounded-full bg-ink px-1.5 text-[11px] font-semibold leading-5 text-white sm:hidden">{list.length}</span>}
                  </span>
                  <span className="hidden flex-col gap-0.5 sm:flex">
                    {list.slice(0, SHOW).map((b) => (
                      <span key={b.id} className="flex items-center gap-1.5 truncate rounded px-1 text-xs leading-5">
                        <span aria-hidden className={`size-1.5 flex-none rounded-full ${DOT[b.status] ?? "bg-muted"}`} />
                        <span className="tabular-nums text-muted">{formatHm(b.startMin)}</span>
                        <span className="truncate">{b.name}</span>
                      </span>
                    ))}
                    {list.length > SHOW && <span className="px-1 text-xs font-medium text-muted">+{list.length - SHOW} бусад</span>}
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
