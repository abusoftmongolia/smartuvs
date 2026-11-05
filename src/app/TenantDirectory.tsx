"use client";
/** Байгууллагын жагсаалт: хайлт + салбараар шүүх. Карт дээр дарахад /<slug> захиалгын хуудас руу. */
import Link from "next/link";
import { useMemo, useState } from "react";
import { matchesQuery } from "@/lib/search";

type Tenant = { slug: string; name: string; industry: string; industryLabel: string; address: string | null };

export function TenantDirectory({ tenants, industries }: { tenants: Tenant[]; industries: { id: string; label: string }[] }) {
  const [q, setQ] = useState("");
  const [industry, setIndustry] = useState<string | null>(null);

  // Зөвхөн байгууллагатай салбаруудыг шүүлтүүрт харуулна
  const present = industries.filter((i) => tenants.some((t) => t.industry === i.id));
  const list = useMemo(
    () => tenants.filter((t) => (!industry || t.industry === industry) && matchesQuery(t, q)),
    [tenants, industry, q],
  );

  if (tenants.length === 0) {
    return <p className="rounded-card border border-line bg-white p-6 text-muted">Одоогоор бүртгэлтэй байгууллага алга.</p>;
  }

  const chip = (on: boolean) =>
    `min-h-11 rounded-full border-[1.5px] px-4 text-sm font-bold ${on ? "border-brand bg-brand text-ink" : "border-line bg-white text-ink"}`;

  return (
    <section aria-label="Байгууллагууд" className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        <label htmlFor="search" className="sr-only">Байгууллага хайх</label>
        <input
          id="search"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Нэр эсвэл хаягаар хайх…"
          autoComplete="off"
          className="min-h-12 w-full rounded-card border-[1.5px] border-[#d6d3cc] bg-white px-4 text-[16px] outline-none focus:border-ink"
        />
        {present.length > 1 && (
          <div className="flex flex-wrap gap-2" role="group" aria-label="Салбар">
            <button onClick={() => setIndustry(null)} aria-pressed={industry === null} className={chip(industry === null)}>Бүгд</button>
            {present.map((i) => (
              <button key={i.id} onClick={() => setIndustry(industry === i.id ? null : i.id)} aria-pressed={industry === i.id} className={chip(industry === i.id)}>
                {i.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <p className="text-sm text-muted" aria-live="polite">{list.length} байгууллага</p>

      {list.length === 0 ? (
        <p className="rounded-card border border-line bg-white p-6 text-muted">Хайлтад тохирох байгууллага олдсонгүй.</p>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((t) => (
            <li key={t.slug}>
              <Link
                href={`/${t.slug}`}
                className="flex h-full min-h-24 flex-col gap-1 rounded-card border-[1.5px] border-line bg-white p-4 hover:border-ink/30 focus-visible:border-ink"
              >
                <span className="self-start rounded-full bg-brand-tint px-2.5 py-0.5 text-xs font-bold text-brand-deep">{t.industryLabel}</span>
                <span className="text-[17px] font-extrabold">{t.name}</span>
                {t.address && <span className="text-sm text-muted">{t.address}</span>}
                <span className="mt-auto pt-2 text-sm font-bold text-ink">Цаг захиалах →</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
