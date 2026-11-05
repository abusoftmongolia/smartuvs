import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { ResetForm } from "./ResetForm";

export const metadata: Metadata = { title: "Нууц үг сэргээх", robots: { index: false } };

export default async function ResetPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main className="mx-auto flex max-w-sm flex-col gap-6 px-4 py-12">
        <div>
          <h1 className="text-3xl font-extrabold">Нууц үг сэргээх</h1>
          <p className="mt-1 text-[15px] text-muted">Утасны дугаараа SMS-ээр баталгаажуулаад шинэ нууц үг тохируулна.</p>
        </div>
        <ResetForm next={next} />
      </main>
    </div>
  );
}
