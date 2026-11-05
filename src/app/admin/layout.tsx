import type { Metadata } from "next";
import { Suspense } from "react";
import { platformStats } from "@/db/admin";
import { requireSuperAdmin } from "@/server/auth";
import { AdminShell } from "./AdminShell";

export const metadata: Metadata = { title: "Админ", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireSuperAdmin();
  const stats = await platformStats();
  return (
    <Suspense>
      <AdminShell userName={admin.name} pending={stats.tenants.pending}>{children}</AdminShell>
    </Suspense>
  );
}
