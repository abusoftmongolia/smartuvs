import Link from "next/link";
import { TenantLogo } from "./TenantLogo";
import { BrandLogo } from "@/components/BrandLogo";

/**
 * Толгой. Лого хар-шар тул үргэлж цагаан дэвсгэр дээр.
 * - Утас: 1-р мөр — SmartUvs (жижиг) ……… Залгах; 2-р мөр — байгууллагын лого + нэр (≤2 мөр) + хаяг.
 * - sm+: нэг мөр — SmartUvs | байгууллага ……… Залгах.
 * Байгууллагын хуудас тул байгууллага платформын брэндээс тод харагдана.
 */
export function SiteHeader(p: { tenantName?: string; tenantSlug?: string; tenantLogo?: string | null; subtitle?: string; phone?: string }) {
  return (
    <header className="border-b border-line bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 gap-y-3 px-4 py-3 sm:flex-nowrap sm:gap-x-4 sm:px-6 sm:py-4">
        <Link href="/" aria-label="SmartUvs цаг захиалга — нүүр" className="order-1 flex-none">
          <BrandLogo logoClass={p.tenantName ? "h-6 sm:h-8" : "h-8"} priority />
        </Link>

        {p.tenantName && (
          <>
            <span aria-hidden className="order-2 hidden h-10 w-px flex-none bg-line sm:block" />
            {/* Утсанд бүтэн өргөнөөр доод мөрөнд, дээд мөрөөс нимгэн зураасаар тусгаарлана */}
            <div className="order-3 -mx-4 flex w-[calc(100%+2rem)] min-w-0 items-center gap-3 border-t border-line px-4 pt-3 sm:mx-0 sm:w-auto sm:flex-1 sm:border-0 sm:px-0 sm:pt-0">
              {p.tenantSlug && <TenantLogo name={p.tenantName} slug={p.tenantSlug} logoUrl={p.tenantLogo ?? null} size={48} />}
              <div className="min-w-0">
                <p className="line-clamp-2 text-balance text-lg font-semibold leading-snug text-ink">{p.tenantName}</p>
                {p.subtitle && <p className="mt-0.5 truncate text-sm text-muted">{p.subtitle}</p>}
              </div>
            </div>
          </>
        )}

        {p.phone && (
          <a
            href={`tel:${p.phone}`}
            aria-label={p.tenantName ? `${p.tenantName} руу залгах` : "Залгах"}
            className="order-2 ml-auto inline-flex min-h-11 min-w-11 flex-none items-center justify-center gap-1.5 rounded-xl border border-line px-3 text-sm font-semibold text-ink hover:bg-brand-tint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:order-4 sm:px-4"
          >
            <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            <span>Залгах</span>
          </a>
        )}
      </div>
    </header>
  );
}
