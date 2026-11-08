/** Хяналтын самбарын хэсгүүд: үзүүлэлтийн хавтан, өдөр бүрийн баганан график, хэсгийн хүрээ. Server component. */
import Link from "next/link";

export type Kpi = { label: string; value: string | number; sub?: string; href?: string; tone?: "dark" | "brand" };

export function KpiGrid({ items, label = "Гол үзүүлэлт" }: { items: Kpi[]; label?: string }) {
  return (
    <ul aria-label={label} className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
      {items.map((k) => {
        const tone = k.tone === "dark" ? "bg-ink text-white" : k.tone === "brand" ? "bg-brand-tint border border-brand/40" : "border border-line bg-white";
        const body = (
          <>
            <span className={`text-sm font-medium ${k.tone === "dark" ? "text-white/75" : "text-muted"}`}>{k.label}</span>
            <span className="text-3xl font-bold tabular-nums tracking-tight sm:text-4xl">{k.value}</span>
            {k.sub && <span className={`text-xs font-medium sm:text-sm ${k.tone === "dark" ? "text-brand" : "text-muted"}`}>{k.sub}</span>}
          </>
        );
        const cls = `flex h-full flex-col gap-1.5 rounded-[20px] p-4 sm:p-5 ${tone}`;
        return (
          <li key={k.label}>
            {k.href ? <Link href={k.href} className={`${cls} transition hover:shadow-[0_8px_24px_-14px_rgba(0,0,0,0.35)]`}>{body}</Link> : <div className={cls}>{body}</div>}
          </li>
        );
      })}
    </ul>
  );
}

export function Panel(p: { id: string; title: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section aria-labelledby={p.id} className={`flex min-w-0 flex-col gap-4 rounded-[22px] border border-line bg-white p-5 sm:p-6 ${p.className ?? ""}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id={p.id} className="text-lg font-bold sm:text-xl">{p.title}</h2>
        {p.action}
      </div>
      {p.children}
    </section>
  );
}

const shortDay = (d: string) => `${Number(d.slice(5, 7))}/${Number(d.slice(8, 10))}`;

/**
 * Нэг цуваа баганан график (legend шаардлагагүй — гарчиг нэрлэнэ). Сүүлийн өдөр (өнөөдөр) шараар онцлогдоно.
 * Hover/фокус дээр тоо гарна; дэлгэц уншигчид — нуусан хүснэгт.
 */
export function DailyBars({ data, caption }: { data: { day: string; n: number }[]; caption: string }) {
  const max = Math.max(1, ...data.map((d) => d.n));
  const total = data.reduce((s, d) => s + d.n, 0);
  const ticks = [max, Math.round(max / 2), 0].filter((v, i, a) => a.indexOf(v) === i);
  return (
    <figure className="flex flex-col gap-3">
      <figcaption className="text-sm text-muted">
        {caption} · нийт <span className="font-semibold tabular-nums text-ink">{total}</span>
      </figcaption>
      <div aria-hidden className="grid grid-cols-[auto_1fr] gap-x-2">
        <div className="flex h-44 flex-col justify-between text-right text-[11px] tabular-nums text-muted">
          {ticks.map((t) => <span key={t} className="-translate-y-1/2 first:translate-y-0 last:translate-y-0">{t}</span>)}
        </div>
        <div className="relative h-44">
          {/* Сааралт тор — дээд ба дунд шугам */}
          <div className="pointer-events-none absolute inset-0 flex flex-col justify-between">
            <span className="border-t border-dashed border-line" /><span className="border-t border-dashed border-line" /><span className="border-t border-line" />
          </div>
          <div className="absolute inset-0 flex items-end gap-[2px]">
            {data.map((d, i) => {
              const today = i === data.length - 1;
              return (
                <div key={d.day} tabIndex={0} className="group relative flex h-full flex-1 items-end justify-center outline-none">
                  <span
                    className={`w-full max-w-7 rounded-t-[4px] transition-opacity group-hover:opacity-80 ${today ? "bg-brand" : "bg-ink"}`}
                    style={{ height: d.n ? `${Math.max(3, (d.n / max) * 100)}%` : "2px", opacity: d.n ? undefined : 0.25 }}
                  />
                  <span className="pointer-events-none absolute bottom-full z-10 mb-1 hidden whitespace-nowrap rounded-lg bg-ink px-2 py-1 text-xs font-medium text-white shadow group-hover:block group-focus-visible:block">
                    {shortDay(d.day)}{today ? " (өнөөдөр)" : ""}: {d.n}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        <span />
        <div className="mt-1.5 flex gap-[2px] text-[11px] tabular-nums text-muted">
          {data.map((d, i) => (
            <span key={d.day} className="flex-1 text-center">{i % 2 === (data.length - 1) % 2 ? shortDay(d.day) : ""}</span>
          ))}
        </div>
      </div>
      <table className="sr-only">
        <caption>{caption}</caption>
        <thead><tr><th>Өдөр</th><th>Захиалга</th></tr></thead>
        <tbody>{data.map((d) => <tr key={d.day}><td>{d.day}</td><td>{d.n}</td></tr>)}</tbody>
      </table>
    </figure>
  );
}

/** Хэвтээ харьцуулах мөрүүд (салбараар байгууллага, шилдэг байгууллага) */
export function BarList({ rows, empty }: { rows: { key: string; label: string; value: number; href?: string }[]; empty: string }) {
  if (rows.length === 0) return <p className="rounded-2xl bg-ground p-4 text-sm text-muted">{empty}</p>;
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="flex flex-col gap-2.5">
      {rows.map((r) => (
        <li key={r.key} className="grid grid-cols-[minmax(0,9rem)_1fr_auto] items-center gap-3 text-sm">
          {r.href ? <a href={r.href} className="truncate font-medium underline-offset-2 hover:underline">{r.label}</a> : <span className="truncate font-medium">{r.label}</span>}
          <span className="h-2.5 overflow-hidden rounded-full bg-ground">
            <span className="block h-full rounded-full bg-ink" style={{ width: `${(r.value / max) * 100}%` }} />
          </span>
          <span className="w-8 text-right font-semibold tabular-nums">{r.value}</span>
        </li>
      ))}
    </ul>
  );
}

export const pct = (r: number | null) => (r === null ? "—" : `${Math.round(r * 100)}%`);
