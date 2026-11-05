import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { currentUser } from "@/server/auth";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Нэвтрэх", robots: { index: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const user = await currentUser();
  if (user) redirect("/dashboard");
  return (
    <div className="min-h-dvh">
      <SiteHeader showLogin={false} />
      <main className="mx-auto flex max-w-sm flex-col gap-6 px-4 py-12">
        <div>
          <h1 className="text-3xl font-extrabold">Нэвтрэх</h1>
          <p className="mt-1 text-[15px] text-muted">Байгууллагын эзэн, ажилтны самбар</p>
        </div>
        <LoginForm next={next} />
      </main>
    </div>
  );
}
