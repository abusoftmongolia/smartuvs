"use client";
/** Байгууллагын жагсаалт: хайлт + салбараар шүүх. Карт дээр дарахад /<slug> захиалгын хуудас руу. */
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { avatarColors, initials } from "@/lib/logo";
import { matchesQuery } from "@/lib/search";

type Tenant = { slug: string; name: string; industry: string; industryLabel: string; address: string | null; logoUrl: string | null };

const SORTS = {
  az: { label: "Нэр: А → Я", cmp: (a: Tenant, b: Tenant) => a.name.localeCompare(b.name, "mn") },
  za: { label: "Нэр: Я → А", cmp: (a: Tenant, b: Tenant) => b.name.localeCompare(a.name, "mn") },
  industry: { label: "Салбараар", cmp: (a: Tenant, b: Tenant) => a.industryLabel.localeCompare(b.industryLabel, "mn") || a.name.localeCompare(b.name, "mn") },
} as const;
type SortKey = keyof typeof SORTS;

export function TenantDirectory({ tenants, industries }: { tenants: Tenant[]; industries: { id: string; label: string }[] }) {
  // smartuvs.mn-ийн хайлтаас ирэхэд: tsag.smartuvs.mn/?q=Үсчин
  const params = useSearchParams();
  const [q, setQ] = useState(() => params.get("q")?.slice(0, 80) ?? "");
  const [industry, setIndustry] = useState<string | null>(null);
  const [sort, setSort] = useState<SortKey>("az");

  // Зөвхөн байгууллагатай салбаруудыг шүүлтүүрт харуулна
  const present = industries.filter((i) => tenants.some((t) => t.industry === i.id));
  const list = useMemo(
    () =>
      tenants
        .filter(
          (t) =>
            (!industry || t.industry === industry) &&
            // Нэр, хаяг эсвэл салбараар ("Үсчин" → бүх үсчин)
            (matchesQuery(t, q) || matchesQuery({ name: t.industryLabel, slug: "", address: null }, q)),
        )
        .sort(SORTS[sort].cmp),
    [tenants, industry, q, sort],
  );

  if (tenants.length === 0) {
    return <p className="rounded-card border border-line bg-white p-6 text-muted">Одоогоор бүртгэлтэй байгууллага алга.</p>;
  }

  const chip = (on: boolean) =>
    `min-h-11 rounded-full border-[1.5px] px-4 text-sm font-semibold ${on ? "border-ink bg-brand text-ink" : "border-line bg-white text-ink"}`;

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
          className="min-h-12 w-full rounded-card border-[1.5px] border-field bg-white px-4 text-base outline-none focus:border-ink"
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

      {/* Тоо + эрэмбэлэх — нэг цагаан туузанд */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[20px] border border-line bg-white px-5 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <p className="text-sm text-muted" aria-live="polite">{list.length} байгууллага</p>
        <label className="flex items-center gap-2 text-sm">
          <span className="sr-only">Эрэмбэлэх</span>
          <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)}
            className="min-h-11 rounded-xl border border-line bg-white px-3 pr-8 text-sm font-medium">
            {(Object.keys(SORTS) as SortKey[]).map((k) => <option key={k} value={k}>{SORTS[k].label}</option>)}
          </select>
        </label>
      </div>

      {list.length === 0 ? (
        <p className="rounded-card border border-line bg-white p-6 text-muted">Хайлтад тохирох байгууллага олдсонгүй.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
          {list.map((t) => (
            <li key={t.slug}>
              <Link href={`/${t.slug}`}
                className="group flex h-full flex-col overflow-hidden rounded-[20px] border border-line bg-white transition hover:-translate-y-0.5 hover:shadow-[0_12px_32px_-14px_rgba(17,17,17,0.28)] focus-visible:border-ink">
                <Cover t={t} />
                <div className="flex flex-1 flex-col gap-1 border-t border-line bg-[#fafafa] px-4 py-3.5 sm:px-5 sm:py-4">
                  <span className="text-base font-semibold leading-snug sm:text-lg">{t.name}</span>
                  {t.address && <span className="line-clamp-1 text-sm text-muted">{t.address}</span>}
                  <span className="mt-auto pt-2 text-sm font-semibold text-brand-deep">
                    Цаг захиалах <span aria-hidden className="inline-block transition group-hover:translate-x-0.5">→</span>
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** Картын дээд хэсэг: лого төвд том; лого байхгүй бол нэрийн үсгээр өнгөт дэвсгэр. Салбар — зүүн дээд буланд */
function Cover({ t }: { t: Tenant }) {
  const c = avatarColors(t.slug);
  return (
    <div className="relative flex aspect-[4/3] items-center justify-center" style={t.logoUrl ? undefined : { background: c.bg }}>
      {t.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- өөрийн API-аас, жижиг
        <img src={t.logoUrl} alt="" loading="lazy" decoding="async" className="size-[55%] object-contain transition group-hover:scale-[1.03]" />
      ) : (
        <span aria-hidden className="text-4xl font-semibold tracking-tight sm:text-5xl" style={{ color: c.fg }}>{initials(t.name)}</span>
      )}
      <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-medium text-ink shadow-[0_1px_2px_rgba(0,0,0,0.08)]">
        {t.industryLabel}
      </span>
    </div>
  );
}
