import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";

export default function NotFound() {
  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <h1 className="text-3xl font-bold">Хуудас олдсонгүй</h1>
        <p className="mt-2 text-muted">Хаягаа шалгана уу, эсвэл байгууллагаас захиалгын холбоосыг нь асуугаарай.</p>
        <Link href="/" className="mt-6 inline-flex min-h-12 items-center rounded-card bg-brand px-6 font-bold text-ink">Нүүр хуудас</Link>
      </main>
    </div>
  );
}
