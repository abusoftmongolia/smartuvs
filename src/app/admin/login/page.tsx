/**
 * SmartUvs Super Admin нэвтрэх — байгууллагын /login-оос тусдаа.
 * Зөвхөн super admin нэвтэрч, шууд /admin руу орно.
 */
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/app/login/LoginForm";
import { currentUser } from "@/server/auth";

export const metadata: Metadata = { title: "Админ нэвтрэх", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  const user = await currentUser();
  if (user?.isSuperAdmin) redirect("/admin");

  return (
    <div className="flex min-h-dvh items-center justify-center bg-ink px-4 py-10">
      <main className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex flex-col items-center gap-3 text-center text-white">
          <div className="flex items-center gap-2">
            <span className="text-[26px] font-extrabold tracking-tight">SmartUVS<span className="text-brand">.MN</span></span>
            <span className="rounded-md bg-brand px-1.5 py-0.5 text-xs font-extrabold text-ink">АДМИН</span>
          </div>
          <h1 className="text-2xl font-extrabold">Платформын удирдлага</h1>
          <p className="text-sm text-white/70">Зөвхөн SmartUvs-ийн super admin нэвтэрнэ.</p>
        </div>
        {user && !user.isSuperAdmin && (
          <p role="status" className="rounded-xl bg-white/10 p-3 text-sm text-white">
            Та {user.name} нэрээр байгууллагын самбарт нэвтэрсэн байна. Админ эрхтэй дугаараар нэвтэрнэ үү.
          </p>
        )}
        <LoginForm scope="admin" />
      </main>
    </div>
  );
}
