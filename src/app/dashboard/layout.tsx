import type { Metadata } from "next";
import { requireUser } from "@/server/auth";

export const metadata: Metadata = { title: "Самбар", robots: { index: false } };
export const dynamic = "force-dynamic";

/** /dashboard/* — нэвтэрсэн байх. Хүрээ (цэс) нь [slug]/layout.tsx-д. */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await requireUser();
  return children;
}
