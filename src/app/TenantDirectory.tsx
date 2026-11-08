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
  // Хайлт, салбар нь URL-аас (толгойн хайлт /?q=, салбарын цэс /?industry=barber,beauty) — холбоосоор хуваалцаж болно
  const params = useSearchParams();
  const q = params.get("q")?.slice(0, 80) ?? "";
  const industryParam = params.get("industry") ?? "";
  const picked = useMemo(() => new Set(industryParam.split(",").filter((x) => industries.some((i) => i.id === x))), [industryParam, industries]);
  const [sort, setSort] = useState<SortKey>("az");

  const list = useMemo(
    () =>
      tenants
        .filter(
          (t) =>
            (picked.size === 0 || picked.has(t.industry)) &&
            // Нэр, хаяг эсвэл салбараар ("Үсчин" → бүх үсчин)
            (matchesQuery(t, q) || matchesQuery({ name: t.industryLabel, slug: "", address: null }, q)),
        )
        .sort(SORTS[sort].cmp),
    [tenants, picked, q, sort],
  );

  const filterLabel = [
    picked.size ? industries.filter((i) => picked.has(i.id)).map((i) => i.label).join(", ") : null,
    q ? `“${q}”` : null,
  ].filter(Boolean).join(" · ");

  return (
    <section id="list" aria-labelledby="h-list" className="flex scroll-mt-4 flex-col gap-3 sm:scroll-mt-32 sm:gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-center gap-3">
          <span aria-hidden className="flex size-10 flex-none items-center justify-center rounded-full bg-brand-tint text-lg text-brand-deep sm:size-12 sm:text-xl">★</span>
          <div>
            <h2 id="h-list" className="text-xl font-bold uppercase tracking-tight sm:text-2xl">Байгууллагууд</h2>
            <p className="text-sm text-muted">{filterLabel || "Сул цагаа хараад утаснаасаа захиална"}</p>
          </div>
        </div>
        {(picked.size > 0 || q) && (
          <Link href="/#list" className="inline-flex min-h-11 items-center gap-1 rounded-xl px-3 text-sm font-medium hover:bg-ground">
            Бүгд <span aria-hidden>→</span>
          </Link>
        )}
      </div>

      {tenants.length === 0 ? (
        <div className="flex flex-col items-start gap-3 rounded-[20px] border border-dashed border-line bg-white p-6 sm:p-8">
          <p className="text-lg font-semibold">Удахгүй энд байгууллагууд нэмэгдэнэ</p>
          <p className="text-sm text-muted">Та байгууллага эрхэлдэг бол 5 минутад үнэгүй бүртгүүлээд онлайн захиалга авч эхлээрэй.</p>
          <Link href="/signup" className="inline-flex min-h-12 items-center rounded-card bg-brand px-5 font-semibold text-ink">Байгууллагаа бүртгүүлэх</Link>
        </div>
      ) : (<>
      {/* Тоо + эрэмбэлэх — нэг цагаан туузанд */}
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-white py-1.5 pl-4 pr-1.5 sm:rounded-[20px] sm:px-5 sm:py-3 sm:shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
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
        <ul className="grid grid-cols-2 gap-2.5 sm:gap-5 lg:grid-cols-3">
          {list.map((t) => (
            <li key={t.slug}>
              <Link href={`/${t.slug}`}
                className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-white transition sm:rounded-[20px] hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0 hover:shadow-[0_12px_32px_-14px_rgba(17,17,17,0.28)] focus-visible:border-ink">
                <Cover t={t} />
                <div className="@container flex flex-1 flex-col gap-0.5 border-t border-line bg-[#fafafa] px-3 py-2.5 sm:gap-1 sm:px-5 sm:py-4">
                  <span className="line-clamp-2 text-[15px] font-semibold leading-snug sm:text-lg">{t.name}</span>
                  {t.address && <span className="line-clamp-1 text-xs text-muted sm:text-sm">{t.address}</span>}
                  <BookCta />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
      </>)}
    </section>
  );
}

/**
 * Картын доод "Цаг захиалах" — товч шиг харагдах span (карт бүхэлдээ нэг Link тул <button> биш).
 * Нэг өнгөний давхарга: тайван шар-цайвар (brand-tint) дэвсгэр, хар бичиг/icon; hover дээр үндсэн шар.
 * Олон картын тор дотор шар том блок давтагдаж хашгирахаас сэргийлнэ. Картын өргөнөөр (container query)
 * ~120px → жижиг бичиг, сумгүй; ≥144px → сум нэмэгдэнэ.
 */
function BookCta() {
  return (
    <span className="mt-auto pt-2 sm:pt-3">
      <span className="flex min-h-10 w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border border-brand/40 bg-brand-tint px-3 text-xs font-semibold text-ink transition-colors duration-200 @[8rem]:text-[13px] @[9rem]:justify-between @[12rem]:min-h-11 @[12rem]:text-sm group-hover:border-brand group-hover:bg-brand motion-reduce:transition-none">
        <span className="flex items-center gap-1.5">
          <CalendarIcon className="size-4 flex-none" />
          Цаг захиалах
        </span>
        <ArrowIcon className="hidden size-4 flex-none transition-transform duration-200 @[9rem]:block group-hover:translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0" />
      </span>
    </span>
  );
}

/** Календарь + чагт — "цаг товлох" утга. Stroke, currentColor */
function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden focusable="false">
      <rect x="3" y="4.5" width="18" height="16.5" rx="3" />
      <path d="M8 2.5v4M16 2.5v4M3 9.5h18" />
      <path d="m9 15 2 2 4-4" />
    </svg>
  );
}

function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden focusable="false">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
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
      <span className="absolute left-2 top-2 max-w-[calc(100%-1rem)] truncate rounded-full bg-white/95 px-2 py-0.5 text-xs font-medium text-ink shadow-[0_1px_2px_rgba(0,0,0,0.08)] sm:left-3 sm:top-3 sm:px-2.5 sm:py-1">
        {t.industryLabel}
      </span>
    </div>
  );
}
