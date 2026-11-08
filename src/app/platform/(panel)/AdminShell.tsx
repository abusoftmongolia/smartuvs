"use client";
/**
 * Super Admin хүрээ: хар sidebar (утсанд цэсээр нээгдэнэ) + хайлт, систем сонголт, мэдэгдэл.
 * Платформын түвшин (/) ба систем бүрийн түвшин (/tsag/...) — систем рүү ороход цэс тухайн системийнх болно.
 */
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { logoutAdmin } from "@/server/auth-actions";
import { BrandLogo } from "@/components/BrandLogo";
import { SYSTEMS, systemOfPath } from "./system-list";

type NavItem = { href: string; label: string; badge?: number; soon?: boolean };

export function AdminShell(p: { userName: string; pending: number; children: React.ReactNode }) {
  // admin.smartuvs.mn/tenants → дотооддоо /platform/tenants; аль ч хэлбэрээр ирсэн ижил болгоно
  const path = usePathname().replace(/^\/platform(?=\/|$)/, "") || "/";
  const router = useRouter();
  const sp = useSearchParams();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [path]);

  const system = systemOfPath(path);
  const current = SYSTEMS.find((x) => x.key === system);
  const groups: { title?: string; items: NavItem[] }[] = system === "tsag"
    ? [
        { items: [{ href: "/tsag", label: "Хяналтын самбар" }] },
        {
          title: "Удирдлага",
          items: [
            { href: "/tsag/tenants", label: "Байгууллагууд", badge: p.pending },
            { href: "/tsag/bookings", label: "Захиалгууд" },
          ],
        },
        {
          title: "Сайтын агуулга",
          items: [
            { href: "/tsag/categories", label: "Ангилал" },
            { href: "/tsag/menu", label: "Үндсэн цэс" },
          ],
        },
      ]
    : [
        { items: [{ href: "/", label: "Хяналтын самбар" }] },
        {
          title: "Системүүд",
          items: SYSTEMS.map((x) => (x.href ? { href: x.href, label: x.name, badge: x.key === "tsag" ? p.pending : undefined } : { href: "#", label: x.name, soon: true })),
        },
        {
          title: "Платформ",
          items: [
            { href: "/users", label: "Хэрэглэгчид" },
            { href: "/systems", label: "Дэд системүүд" },
            { href: "#", label: "Эрх ба үүрэг", soon: true },
            { href: "#", label: "Тохиргоо", soon: true },
          ],
        },
      ];
  // Самбарууд (/ ба /tsag) зөвхөн яг тэр замд идэвхтэй; бусад нь доод замуудтайгаа
  const isActive = (href: string) => (href === "/" || href === current?.href ? path === href : path === href || path.startsWith(`${href}/`));

  const sidebar = (
    <nav aria-label="Админ цэс" className="flex h-full flex-col gap-6 bg-ink px-4 py-6 text-white">
      <Link href="/" className="flex items-center gap-2 px-2">
        {/* Лого хар-шар тул хар sidebar дээр цагаан хавтан дотор */}
        <span className="rounded-lg bg-white px-2.5 py-2"><BrandLogo logoClass="h-6" caption={false} priority /></span>
        <span className="rounded-md bg-brand px-1.5 py-0.5 text-[11px] font-medium text-ink">АДМИН</span>
      </Link>
      {current && (
        <div className="flex flex-col gap-1 rounded-2xl border border-white/10 bg-white/5 p-2">
          <Link href="/" className="flex min-h-10 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-white/70 hover:bg-white/10 hover:text-white">
            <span aria-hidden>←</span> Бүх систем
          </Link>
          <div className="px-2 pb-1">
            <div className="text-[11px] font-medium uppercase tracking-wider text-white/50">Систем</div>
            <div className="text-base font-semibold">{current.name}</div>
            <div className="truncate text-xs text-white/60">{current.host}</div>
          </div>
        </div>
      )}
      <div className="flex flex-1 flex-col gap-5 overflow-y-auto">
        {groups.map((g, i) => (
          <div key={i} className="flex flex-col gap-1">
            {g.title && <div className="px-3 pb-1 text-[11px] font-medium uppercase tracking-wider text-white/50">{g.title}</div>}
            {g.items.map((it) =>
              it.soon ? (
                <span key={it.label} className="flex min-h-11 items-center justify-between rounded-xl px-3 text-sm font-medium text-white/40" aria-disabled>
                  {it.label}<span className="text-[10px] font-medium uppercase">удахгүй</span>
                </span>
              ) : (
                <Link key={it.href} href={it.href} aria-current={isActive(it.href) ? "page" : undefined}
                  className={`flex min-h-11 items-center justify-between rounded-xl px-3 text-sm font-semibold ${isActive(it.href) ? "bg-brand text-ink" : "text-white hover:bg-white/10"}`}>
                  {it.label}
                  {!!it.badge && (
                    <span className={`flex min-w-6 items-center justify-center rounded-full px-1.5 text-xs font-medium ${isActive(it.href) ? "bg-ink text-brand" : "bg-brand text-ink"}`}>{it.badge}</span>
                  )}
                </Link>
              ),
            )}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
        <span aria-hidden className="flex size-10 flex-none items-center justify-center rounded-full bg-brand text-lg font-semibold text-ink">
          {/* "Г.Батжаргал" → "Б" (овгийн үсгийг алгасна) */}
          {(p.userName.split(".").pop()?.trim() || p.userName).slice(0, 1).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">{p.userName}</div>
          <div className="text-xs text-white/60">Супер админ</div>
        </div>
        <form action={async () => { const r = await logoutAdmin(); window.location.assign(r.to); }}>
          <button aria-label="Гарах" className="inline-flex size-11 items-center justify-center rounded-xl text-white/80 hover:bg-white/10">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" /></svg>
          </button>
        </form>
      </div>
    </nav>
  );

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[264px_1fr]">
      <aside className="sticky top-0 hidden h-dvh lg:block">{sidebar}</aside>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button aria-label="Цэс хаах" className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-[280px] max-w-[85vw]">{sidebar}</aside>
        </div>
      )}
      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-line bg-white px-4 py-3 sm:px-6">
          <button aria-label="Цэс нээх" onClick={() => setOpen(true)} className="inline-flex size-11 flex-none items-center justify-center rounded-xl border border-line lg:hidden">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><path d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <form action="/search" className="relative min-w-0 flex-1 lg:max-w-xl" role="search">
            <label htmlFor="admin-search" className="sr-only">Хайх</label>
            <svg className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
            <input id="admin-search" name="q" type="search" defaultValue={path === "/search" ? (sp.get("q") ?? "") : ""} placeholder="Байгууллага, хэрэглэгч хайх…"
              className="min-h-11 w-full rounded-xl border border-line bg-ground pl-10 pr-3 text-base outline-none focus:border-ink" />
          </form>
          <label className="ml-auto hidden items-center gap-2 text-sm font-medium text-muted md:flex">
            Систем
            <select value={current?.href ?? "/"} onChange={(e) => router.push(e.target.value)}
              className="min-h-11 rounded-xl border border-line bg-white px-3 text-base font-medium text-ink">
              <option value="/">Бүх систем</option>
              {SYSTEMS.map((x) => (
                <option key={x.key} value={x.href ?? x.key} disabled={!x.href}>{x.name}{x.href ? "" : ` (${x.note.toLowerCase()})`}</option>
              ))}
            </select>
          </label>
          <Link href="/tsag/tenants?status=pending" aria-label={`Мэдэгдэл: ${p.pending} байгууллага хүлээгдэж буй`}
            className="relative inline-flex size-11 flex-none items-center justify-center rounded-xl border border-line bg-white">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></svg>
            {p.pending > 0 && <span className="absolute right-2 top-2 size-2.5 rounded-full bg-danger ring-2 ring-white" />}
          </Link>
        </header>
        <main className="mx-auto flex w-full max-w-[1400px] flex-col gap-6 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">{p.children}</main>
      </div>
    </div>
  );
}
