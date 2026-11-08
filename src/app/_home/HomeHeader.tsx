/**
 * Нүүр хуудасны толгой (uvsmarket.mn-тэй нэг загвар): лого · хайлт · Нэвтрэх / Бүртгүүлэх,
 * доор нь салбарын цэс. Хайлт нь энгийн GET form — JS-гүй ч ажиллана (/?q=).
 */
import Link from "next/link";
import { MobileMenu } from "./MobileMenu";
import { SearchShortcut } from "./SearchShortcut";
import { BrandLogo } from "@/components/BrandLogo";
import type { NavLink } from "@/lib/site-config";

export function HomeHeader({ industries, nav }: { industries: { id: string; label: string }[]; nav: NavLink[] }) {
  return (
    <header className="border-b border-line bg-white sm:sticky sm:top-0 sm:z-30 sm:bg-white/95 sm:backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2.5 px-4 pb-3 pt-2.5 sm:px-6 sm:py-4">
        <MobileMenu industries={industries} links={nav.filter((l) => !l.key.startsWith("ind-") && l.icon !== "grid")} />
        <Link href="/" aria-label="SmartUvs цаг захиалга — нүүр" className="flex-none">
          <BrandLogo logoClass="h-7 sm:h-8" priority />
        </Link>

        <form action="/" role="search" className="order-last w-full sm:order-none sm:max-w-md sm:flex-1">
          <label htmlFor="q" className="sr-only">Байгууллага, үйлчилгээ хайх</label>
          <div className="flex min-h-12 items-center gap-2 rounded-2xl border border-line bg-[#f7f7f7] px-4 focus-within:border-ink focus-within:bg-white sm:bg-white sm:shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <svg aria-hidden width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="flex-none text-muted"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
            <input id="q" name="q" type="search" placeholder="Байгууллага, үйлчилгээ хайх…" autoComplete="off" enterKeyHint="search"
              className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted" />
            <kbd aria-hidden className="hidden rounded-md border border-line bg-ground px-1.5 py-0.5 font-sans text-xs text-muted sm:inline">/</kbd>
          </div>
          <SearchShortcut inputId="q" />
        </form>

        <nav aria-label="Бүртгэл" className="ml-auto hidden items-center gap-2 sm:flex">
          {/* Байгууллагын товчнууд — утсанд үйлчлүүлэгчийн анхаарлыг булаахгүйн тулд жижиг "Нэвтрэх" л */}
          <Link href="/admin/login" className="inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-medium hover:bg-ground">Нэвтрэх</Link>
          <Link href="/signup" className="inline-flex min-h-11 items-center rounded-xl bg-ink px-4 text-sm font-semibold text-white">Бүртгүүлэх</Link>
        </nav>
      </div>

      {/* Салбарын цэс — утсанд хэвтээ гүйлгэнэ */}
      <nav aria-label="Салбар" className="hidden border-t border-line bg-[#f7f7f7] sm:block">
        <ul className="mx-auto flex max-w-6xl items-center gap-1 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {nav.map((l, i) => {
            // Онцолсон (accent) мөрүүд баруун тийш шахагдана
            const pushRight = l.accent && !nav[i - 1]?.accent;
            return (
              <li key={l.key} className={`flex-none ${pushRight ? "ml-auto" : ""}`}>
                <Link href={l.href} className={`inline-flex min-h-11 items-center gap-2 whitespace-nowrap rounded-lg px-3 text-sm hover:bg-white ${l.accent ? "font-medium text-brand-deep" : l.icon ? "font-medium" : ""}`}>
                  {l.icon === "grid" && (
                    <svg aria-hidden width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="4" width="6" height="6" rx="1.5" /><rect x="14" y="4" width="6" height="6" rx="1.5" /><rect x="4" y="14" width="6" height="6" rx="1.5" /><rect x="14" y="14" width="6" height="6" rx="1.5" /></svg>
                  )}
                  {l.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
