"use client";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { ErrorBox } from "@/components/ui";
import { matchesQuery } from "@/lib/search";
import { changeTenantStatus } from "@/server/admin-actions";

type Row = {
  id: string;
  slug: string;
  name: string;
  industry: string;
  status: string;
  address: string | null;
  createdAt: string;
  isNew: boolean;
  owner: string;
  bookings30d: number;
  noShow30d: number;
  services: number;
};

type Filter = "all" | "new" | "active" | "suspended";
const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "Бүгд" },
  { id: "new", label: "Шинэ (7 хоног)" },
  { id: "active", label: "Идэвхтэй" },
  { id: "suspended", label: "Хаалттай" },
];

export function TenantTable({ tenants }: { tenants: Row[] }) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [, start] = useTransition();

  const list = useMemo(
    () =>
      tenants.filter(
        (t) =>
          (filter === "all" || (filter === "new" ? t.isNew : t.status === filter)) &&
          matchesQuery(t, q),
      ),
    [tenants, filter, q],
  );

  const toggle = (t: Row) => {
    const next = t.status === "active" ? "suspended" : "active";
    if (next === "suspended" && !confirm(`"${t.name}"-г хаах уу? Захиалгын хуудас нь нээгдэхээ болино.`)) return;
    setBusy(t.id);
    start(async () => {
      setError(null);
      const r = await changeTenantStatus({ tenantId: t.id, status: next });
      if (!r.ok) setError(r.message);
      setBusy(null);
    });
  };

  const chip = (on: boolean) =>
    `min-h-11 rounded-full border-[1.5px] px-4 text-sm font-bold ${on ? "border-brand bg-brand text-ink" : "border-line bg-white"}`;

  return (
    <section aria-labelledby="h-tenants" className="flex flex-col gap-3">
      <h2 id="h-tenants" className="text-lg font-extrabold">Байгууллагууд</h2>
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="admin-q" className="sr-only">Хайх</label>
        <input id="admin-q" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Нэр, хаяг…"
          className="min-h-11 min-w-56 flex-1 rounded-xl border-[1.5px] border-[#d6d3cc] bg-white px-3 text-[15px]" />
        {FILTERS.map((f) => (
          <button key={f.id} onClick={() => setFilter(f.id)} aria-pressed={filter === f.id} className={chip(filter === f.id)}>{f.label}</button>
        ))}
      </div>
      {error && <ErrorBox>{error}</ErrorBox>}
      <p className="text-sm text-muted" aria-live="polite">{list.length} байгууллага</p>

      <div className="overflow-x-auto rounded-[18px] border border-line bg-white">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="border-b border-line bg-ground text-[13px] text-muted">
            <tr>
              <th className="px-4 py-3 font-bold">Байгууллага</th>
              <th className="px-3 py-3 font-bold">Эзэмшигч</th>
              <th className="px-3 py-3 font-bold">Бүртгүүлсэн</th>
              <th className="px-3 py-3 text-right font-bold">Захиалга 30х</th>
              <th className="px-3 py-3 text-right font-bold">Ирээгүй</th>
              <th className="px-3 py-3 font-bold">Төлөв</th>
              <th className="px-4 py-3"><span className="sr-only">Үйлдэл</span></th>
            </tr>
          </thead>
          <tbody>
            {list.map((t) => (
              <tr key={t.id} className="border-b border-line last:border-b-0 align-top">
                <td className="px-4 py-3">
                  <div className="font-bold">
                    {t.name}
                    {t.isNew && <span className="ml-2 rounded-full bg-brand-tint px-2 py-0.5 text-[11px] font-bold text-brand-deep">ШИНЭ</span>}
                  </div>
                  <div className="text-xs text-muted">{t.industry} · /{t.slug}{t.address ? ` · ${t.address}` : ""}</div>
                  {t.services === 0 && <div className="text-xs font-bold text-red-800">Үйлчилгээгүй — жагсаалтад харагдахгүй</div>}
                </td>
                <td className="px-3 py-3">{t.owner}</td>
                <td className="px-3 py-3 tabular-nums">{t.createdAt}</td>
                <td className="px-3 py-3 text-right tabular-nums">{t.bookings30d}</td>
                <td className="px-3 py-3 text-right tabular-nums">{t.noShow30d}</td>
                <td className="px-3 py-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${t.status === "active" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
                    {t.status === "active" ? "Идэвхтэй" : "Хаалттай"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap justify-end gap-2">
                    <Link href={`/${t.slug}`} target="_blank" className="inline-flex min-h-11 items-center rounded-xl border border-line px-3 font-bold">Хуудас</Link>
                    <Link href={`/dashboard/${t.slug}`} className="inline-flex min-h-11 items-center rounded-xl border border-line px-3 font-bold">Самбар</Link>
                    <button disabled={busy === t.id} onClick={() => toggle(t)}
                      className={`inline-flex min-h-11 items-center rounded-xl border px-3 font-bold disabled:opacity-50 ${t.status === "active" ? "border-red-200 text-red-800" : "border-green-300 text-green-800"}`}>
                      {t.status === "active" ? "Хаах" : "Нээх"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
