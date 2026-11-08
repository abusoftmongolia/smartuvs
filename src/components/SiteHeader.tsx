import Link from "next/link";
import { TenantLogo } from "./TenantLogo";
import { BrandLogo } from "@/components/BrandLogo";

/** Толгой: SmartUvs лого | байгууллагын нэр. Лого хар-шар тул үргэлж цагаан дэвсгэр дээр. */
export function SiteHeader(p: { tenantName?: string; tenantSlug?: string; tenantLogo?: string | null; subtitle?: string; phone?: string }) {
  return (
    <header className="border-b border-line bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Link href="/" aria-label="SmartUvs цаг захиалга — нүүр">
            <BrandLogo logoClass="h-8" priority />
          </Link>
          {p.tenantName && (
            <>
              <span aria-hidden className="h-8 w-px bg-line" />
              {p.tenantSlug && <TenantLogo name={p.tenantName} slug={p.tenantSlug} logoUrl={p.tenantLogo ?? null} size={44} />}
              <div>
                <div className="text-lg font-semibold leading-tight">{p.tenantName}</div>
                {p.subtitle && <div className="text-xs text-muted">{p.subtitle}</div>}
              </div>
            </>
          )}
        </div>
        {p.phone && (
          <a href={`tel:${p.phone}`} className="inline-flex min-h-11 items-center rounded-xl border border-line px-4 text-sm font-semibold">
            Залгах
          </a>
        )}
      </div>
    </header>
  );
}
