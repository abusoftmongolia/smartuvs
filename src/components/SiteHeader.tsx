import Image from "next/image";
import Link from "next/link";
import { TenantLogo } from "./TenantLogo";

/**
 * Толгой: SmartUvs лого | байгууллагын нэр. Лого хар-шар тул үргэлж цагаан дэвсгэр дээр.
 * Ерөнхий хуудсанд (байгууллагын бус) баруун талд "Нэвтрэх" — байгууллагын эзэн, ажилтанд.
 * Үйлчлүүлэгч бүртгэлгүй захиалдаг тул байгууллагын захиалгын хуудсанд харуулахгүй.
 */
export function SiteHeader(p: {
  tenantName?: string;
  tenantSlug?: string;
  tenantLogo?: string | null;
  subtitle?: string;
  phone?: string;
  /** Нэвтрэх хуудсан дээр өөрийгөө давтахгүйн тулд false */
  showLogin?: boolean;
}) {
  const showLogin = p.showLogin ?? !p.tenantName;
  return (
    <header className="border-b border-line bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Link href="/" aria-label="SmartUvs цаг захиалга — нүүр">
            <Image src="/smartuvs-logo.png" alt="SmartUvs.mn" width={206} height={32} className="h-8 w-auto" priority />
          </Link>
          {p.tenantName && (
            <>
              <span aria-hidden className="h-8 w-px bg-line" />
              {p.tenantSlug && <TenantLogo name={p.tenantName} slug={p.tenantSlug} logoUrl={p.tenantLogo ?? null} size={44} />}
              <div>
                <div className="text-lg font-extrabold leading-tight">{p.tenantName}</div>
                {p.subtitle && <div className="text-[13px] text-muted">{p.subtitle}</div>}
              </div>
            </>
          )}
        </div>
        {p.phone && (
          <a href={`tel:${p.phone}`} className="inline-flex min-h-11 items-center rounded-xl border border-line px-4 text-sm font-semibold">
            Залгах
          </a>
        )}
        {showLogin && (
          <Link href="/admin/login" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-ink px-4 text-sm font-bold text-white hover:bg-ink/90">
            <svg aria-hidden width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>
            Нэвтрэх
          </Link>
        )}
      </div>
    </header>
  );
}
