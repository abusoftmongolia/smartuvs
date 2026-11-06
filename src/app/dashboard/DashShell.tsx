"use client";
/**
 * Байгууллагын самбарын хүрээ: дээд мөр (лого, байгууллага, хэрэглэгч) + зүүн цэс.
 * Утсанд цэс товчоор нээгдэнэ. Хэвлэхэд (QR постер) цэс нуугдана.
 */
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { logout } from "@/server/auth-actions";

type Item = { href: string; label: string; icon: keyof typeof ICONS; badge?: number; exact?: boolean };

export function DashShell(p: {
  slug: string;
  tenantName: string;
  userName: string;
  staffTerm: string;
  canManage: boolean;
  pendingCount: number;
  multiTenant: boolean;
  children: React.ReactNode;
}) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [path]);

  const base = `/dashboard/${p.slug}`;
  const groups: { title: string; items: Item[] }[] = [
    {
      title: "Цаг захиалга",
      items: [
        { href: base, label: "Хянах самбар", icon: "home", exact: true },
        { href: `${base}/calendar`, label: "Календарь", icon: "calendar" },
        { href: `${base}/pending`, label: "Хүлээгдэж буй", icon: "inbox", badge: p.pendingCount },
        { href: `${base}/history`, label: "Захиалгын түүх", icon: "history" },
      ],
    },
    ...(p.canManage
      ? [{
          title: "Удирдах",
          items: [
            { href: `${base}/services`, label: "Үйлчилгээ", icon: "list" as const },
            { href: `${base}/staff`, label: p.staffTerm, icon: "users" as const },
            { href: `${base}/hours`, label: "Ажлын цаг, чөлөө", icon: "clock" as const },
            { href: `${base}/share`, label: "Хуваалцах / QR", icon: "qr" as const },
            { href: `${base}/settings`, label: "Тохиргоо", icon: "sliders" as const },
          ],
        }]
      : []),
  ];
  const active = (it: Item) => (it.exact ? path === it.href : path === it.href || path.startsWith(`${it.href}/`));

  const nav = (
    <nav aria-label="Самбарын цэс" className="flex flex-col gap-6 p-3">
      {groups.map((g) => (
        <div key={g.title} className="flex flex-col gap-0.5">
          <div className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted">{g.title}</div>
          {g.items.map((it) => {
            const on = active(it);
            return (
              <Link key={it.href} href={it.href} aria-current={on ? "page" : undefined}
                className={`flex min-h-10 items-center gap-2.5 rounded-lg px-3 text-sm transition ${on ? "bg-white font-medium text-ink shadow-[0_1px_2px_rgba(0,0,0,0.06)] ring-1 ring-line" : "text-ink/75 hover:bg-white/70 hover:text-ink"}`}>
                <span className={on ? "text-ink" : "text-muted"}>{ICONS[it.icon]}</span>
                <span className="flex-1">{it.label}</span>
                {!!it.badge && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-pending px-1.5 text-[11px] font-semibold text-white" aria-label={`${it.badge} хүлээгдэж буй`}>
                    {it.badge > 99 ? "99+" : it.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      ))}
      <div className="flex flex-col gap-0.5 border-t border-line pt-4">
        <a href={`/${p.slug}`} target="_blank" className="flex min-h-10 items-center gap-2.5 rounded-lg px-3 text-sm text-ink/75 hover:bg-white/70 hover:text-ink">
          <span className="text-muted">{ICONS.external}</span>Захиалгын хуудас
        </a>
        {p.multiTenant && (
          <Link href="/dashboard" className="flex min-h-10 items-center gap-2.5 rounded-lg px-3 text-sm text-ink/75 hover:bg-white/70 hover:text-ink">
            <span className="text-muted">{ICONS.switch}</span>Байгууллага солих
          </Link>
        )}
      </div>
    </nav>
  );

  return (
    <div className="min-h-dvh bg-[#fcfcfc]">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-white px-3 sm:px-4 print:hidden">
        <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="dash-nav" aria-label={open ? "Цэс хаах" : "Цэс нээх"}
          className="inline-flex size-10 items-center justify-center rounded-lg border border-line lg:hidden">
          {open ? ICONS.close : ICONS.menu}
        </button>
        <Link href={base} aria-label="Хянах самбар" className="flex items-center">
          <Image src="/smartuvs-logo.png" alt="SmartUvs.mn" width={1200} height={175} className="h-6 w-auto" priority />
        </Link>
        <span aria-hidden className="hidden h-6 w-px bg-line sm:block" />
        <span className="hidden truncate text-sm font-medium sm:block">{p.tenantName}</span>
        <div className="ml-auto flex items-center gap-2">
          <span className="hidden text-sm text-muted md:inline">{p.userName}</span>
          <form action={logout}>
            <button className="inline-flex min-h-10 items-center rounded-lg border border-line px-3.5 text-sm font-medium">Гарах</button>
          </form>
        </div>
      </header>
      <div className="flex">
        <aside className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-60 flex-none overflow-y-auto border-r border-line bg-[#f5f5f5] lg:block print:hidden">
          {nav}
        </aside>
        {open && (
          <div className="fixed inset-0 top-14 z-20 lg:hidden print:hidden">
            <button aria-label="Цэс хаах" className="absolute inset-0 bg-ink/30" onClick={() => setOpen(false)} />
            <aside id="dash-nav" className="relative h-full w-72 max-w-[85%] overflow-y-auto border-r border-line bg-[#f5f5f5]">{nav}</aside>
          </div>
        )}
        <main className="min-w-0 flex-1">{p.children}</main>
      </div>
    </div>
  );
}

const ic = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
const ICONS = {
  home: <svg {...ic}><path d="M4 11l8-7 8 7v8.5a1.5 1.5 0 0 1-1.5 1.5H15v-6H9v6H5.5A1.5 1.5 0 0 1 4 19.5z" /></svg>,
  calendar: <svg {...ic}><rect x="3" y="5" width="18" height="16" rx="2.5" /><path d="M8 3v4M16 3v4M3 10h18" /></svg>,
  inbox: <svg {...ic}><path d="M3 13l2.5-7.5A2 2 0 0 1 7.4 4h9.2a2 2 0 0 1 1.9 1.5L21 13v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><path d="M3 13h5l1.5 2.5h5L16 13h5" /></svg>,
  history: <svg {...ic}><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5M12 7v5l3 2" /></svg>,
  list: <svg {...ic}><path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01" /></svg>,
  users: <svg {...ic}><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6.5 6.5 0 0 1 3.5 6" /></svg>,
  clock: <svg {...ic}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>,
  qr: <svg {...ic}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><path d="M14 14h3v3M21 14v.01M14 21h3M21 17v4h-1" /></svg>,
  sliders: <svg {...ic}><path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0" /><circle cx="16" cy="6" r="2" /><circle cx="10" cy="12" r="2" /><circle cx="18" cy="18" r="2" /></svg>,
  external: <svg {...ic}><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></svg>,
  switch: <svg {...ic}><path d="M7 7h13l-3-3M17 17H4l3 3" /></svg>,
  menu: <svg {...ic}><path d="M4 7h16M4 12h16M4 17h16" /></svg>,
  close: <svg {...ic}><path d="M6 6l12 12M18 6L6 18" /></svg>,
};
