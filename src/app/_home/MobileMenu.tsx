"use client";
/**
 * Утасны hamburger цэс — native <dialog> (фокус хоригдоно, Esc-ээр хаагдана, ар тал inert).
 * Салбарууд, байгууллагын холбоосууд. Компьютерт харагдахгүй (sm:hidden).
 */
import Link from "next/link";
import { useEffect, useRef } from "react";
import type { NavLink } from "@/lib/site-config";

/** links — Үндсэн цэсийн нэмэлт холбоосууд (салбар, "Бүх салбар"-аас бусад) */
export function MobileMenu({ industries, links = [] }: { industries: { id: string; label: string }[]; links?: NavLink[] }) {
  const ref = useRef<HTMLDialogElement>(null);
  const open = () => ref.current?.showModal();
  const close = () => ref.current?.close();

  // Холбоос дарж хуудас шилжихэд (эсвэл #list руу) цэсийг хаана
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    const onClick = (e: MouseEvent) => {
      if (e.target === d) close(); // арын бүдэг хэсэг дээр дарвал
      if ((e.target as HTMLElement).closest("a")) close();
    };
    d.addEventListener("click", onClick);
    return () => d.removeEventListener("click", onClick);
  }, []);

  const item = "flex min-h-12 items-center rounded-xl px-3 text-base hover:bg-ground";
  return (
    <>
      <button type="button" onClick={open} aria-label="Цэс нээх" aria-haspopup="dialog"
        className="-ml-2 inline-flex size-11 flex-none items-center justify-center rounded-xl hover:bg-ground sm:hidden">
        <svg aria-hidden width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
      </button>

      <dialog ref={ref} aria-label="Цэс"
        className="m-0 h-dvh max-h-none w-[86%] max-w-sm bg-white p-0 text-ink backdrop:bg-ink/40 open:animate-[menu-in_180ms_ease-out]">
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-line px-4 py-2">
            <span className="text-base font-semibold">Цэс</span>
            <button type="button" onClick={close} aria-label="Цэс хаах" className="inline-flex size-11 items-center justify-center rounded-xl hover:bg-ground">
              <svg aria-hidden width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
            </button>
          </div>

          <nav aria-label="Салбар" className="flex-1 overflow-y-auto px-2 py-3">
            <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-muted">Салбар</p>
            <ul>
              <li><Link href="/#list" className={`${item} font-semibold`}>Бүх байгууллага</Link></li>
              {industries.map((i) => (
                <li key={i.id}><Link href={`/?industry=${i.id}#list`} className={item}>{i.label}</Link></li>
              ))}
            </ul>
            {links.length > 0 && (
              <>
                <p className="px-3 pb-1 pt-4 text-xs font-semibold uppercase tracking-wide text-muted">Цэс</p>
                <ul>
                  {links.map((l) => (
                    <li key={l.key}><Link href={l.href} className={`${item} ${l.accent ? "font-medium text-brand-deep" : ""}`}>{l.label}</Link></li>
                  ))}
                </ul>
              </>
            )}
          </nav>

          {/* Байгууллагын хэсэг — доод талд, эрхий хуруунд ойр */}
          <div className="flex flex-col gap-2 border-t border-line p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Байгууллагад</p>
            <Link href="/signup" className="inline-flex min-h-12 items-center justify-center rounded-card bg-ink font-semibold text-white">Байгууллагаа бүртгүүлэх</Link>
            <div className="grid grid-cols-2 gap-2">
              <Link href="/admin/login" className="inline-flex min-h-12 items-center justify-center rounded-card border border-line font-medium">Нэвтрэх</Link>
              <Link href="/business" className="inline-flex min-h-12 items-center justify-center rounded-card border border-line font-medium">Танилцуулга</Link>
            </div>
          </div>
        </div>
      </dialog>
    </>
  );
}
