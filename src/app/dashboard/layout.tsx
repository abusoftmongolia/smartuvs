import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { requireUser } from "@/server/auth";
import { logout } from "@/server/auth-actions";

export const metadata: Metadata = { title: "Самбар", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <div className="min-h-dvh">
      <header className="border-b border-line bg-white print:hidden">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/dashboard" aria-label="Самбар — нүүр" className="flex items-center gap-3">
            <Image src="/smartuvs-logo.png" alt="SmartUvs.mn" width={206} height={32} className="h-7 w-auto" priority />
          </Link>
          <div className="flex items-center gap-2">
            <span className="hidden text-sm font-semibold text-muted sm:inline">{user.name}</span>
            {user.isSuperAdmin && (
              <Link href="/admin" className="inline-flex min-h-11 items-center rounded-xl bg-ink px-4 text-sm font-bold text-white">Админ</Link>
            )}
            <form action={logout}>
              <button className="inline-flex min-h-11 items-center rounded-xl border border-line px-4 text-sm font-bold">Гарах</button>
            </form>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
