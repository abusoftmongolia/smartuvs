"use client";
/** Байгууллагын жагсаалт: хайлт + салбараар шүүх. Карт дээр дарахад /<slug> захиалгын хуудас руу. */
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { TenantLogo } from "@/components/TenantLogo";
import { matchesQuery } from "@/lib/search";

type Tenant = { slug: string; name: string; industry: string; industryLabel: string; address: string | null; logoUrl: string | null };

export function TenantDirectory({ tenants, industries }: { tenants: Tenant[]; industries: { id: string; label: string }[] }) {
  // smartuvs.mn-ийн хайлтаас ирэхэд: tsag.smartuvs.mn/?q=Үсчин
  const params = useSearchParams();
  const [q, setQ] = useState(() => params.get("q")?.slice(0, 80) ?? "");
  const [industry, setIndustry] = useState<string | null>(null);

  // Зөвхөн байгууллагатай салбаруудыг шүүлтүүрт харуулна
  const present = industries.filter((i) => tenants.some((t) => t.industry === i.id));
  const list = useMemo(
    () =>
      tenants.filter(
        (t) =>
          (!industry || t.industry === industry) &&
          // Нэр, хаяг эсвэл салбараар ("Үсчин" → бүх үсчин)
          (matchesQuery(t, q) || matchesQuery({ name: t.industryLabel, slug: "", address: null }, q)),
      ),
    [tenants, industry, q],
  );

  if (tenants.length === 0) {
    return <p className="rounded-card border border-line bg-white p-6 text-muted">Одоогоор бүртгэлтэй байгууллага алга.</p>;
  }

  const chip = (on: boolean) =>
    `min-h-11 rounded-full border-[1.5px] px-4 text-sm font-semibold ${on ? "border-brand bg-brand text-ink" : "border-line bg-white text-ink"}`;

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
          className="min-h-12 w-full rounded-card border-[1.5px] border-[#d4d4d4] bg-white px-4 text-base outline-none focus:border-ink"
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
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((t) => (
            <li key={t.slug}>
              <Link
                href={`/${t.slug}`}
                className="group flex h-full flex-col gap-4 rounded-[20px] border border-line bg-white p-5 transition hover:-translate-y-0.5 hover:border-ink/20 hover:shadow-[0_10px_30px_-12px_rgba(17,17,17,0.25)] focus-visible:border-ink"
              >
                <div className="flex items-start gap-4">
                  <TenantLogo name={t.name} slug={t.slug} logoUrl={t.logoUrl} size={64} />
                  <div className="flex min-w-0 flex-col items-start gap-1.5">
                    <span className="text-lg font-semibold leading-snug">{t.name}</span>
                    <span className="rounded-full bg-brand-tint px-2.5 py-0.5 text-xs font-medium text-brand-deep">{t.industryLabel}</span>
                  </div>
                </div>
                {t.address && (
                  <span className="flex items-start gap-1.5 text-sm text-muted">
                    <svg aria-hidden width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 flex-none"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></svg>
                    {t.address}
                  </span>
                )}
                <span className="mt-auto flex min-h-11 items-center justify-between rounded-xl bg-ground px-4 text-sm font-semibold transition group-hover:bg-brand">
                  Цаг захиалах
                  <span aria-hidden className="transition group-hover:translate-x-0.5">→</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
