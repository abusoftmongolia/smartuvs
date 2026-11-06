/**
 * SmartUvs Super Admin нэвтрэх — байгууллагын /login-оос тусдаа.
 * Зөвхөн super admin нэвтэрч, шууд /admin руу орно.
 */
import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { LoginForm } from "@/app/login/LoginForm";
import { currentUser } from "@/server/auth";

export const metadata: Metadata = { title: "Админ нэвтрэх", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  const user = await currentUser();
  if (user?.isSuperAdmin) redirect("/");

  return (
    <div className="flex min-h-dvh items-center justify-center bg-ink px-4 py-10">
      <main className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex flex-col items-center gap-3 text-center text-white">
          <div className="flex items-center gap-2">
            <span className="rounded-xl bg-white px-3.5 py-2.5"><Image src="/smartuvs-logo.png" alt="SmartUvs.mn" width={1200} height={175} className="h-7 w-auto" priority /></span>
            <span className="rounded-md bg-brand px-1.5 py-0.5 text-xs font-medium text-ink">АДМИН</span>
          </div>
          <h1 className="text-2xl font-bold">Платформын удирдлага</h1>
          <p className="text-sm text-white/70">admin.smartuvs.mn · зөвхөн SmartUvs-ийн super admin</p>
        </div>
        {user && !user.isSuperAdmin && (
          <p role="status" className="rounded-xl bg-white/10 p-3 text-sm text-white">
            Та {user.name} нэрээр нэвтэрсэн ч super admin эрхгүй байна.
          </p>
        )}
        <LoginForm scope="admin" />
      </main>
    </div>
  );
}
