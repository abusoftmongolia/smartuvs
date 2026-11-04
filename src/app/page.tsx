import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";

/** tsag.smartuvs.mn нүүр — байгууллагуудад зориулсан танилцуулга */
export default function Home() {
  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main className="mx-auto flex max-w-3xl flex-col items-start gap-6 px-4 py-16 sm:px-6">
        <h1 className="text-4xl font-extrabold leading-tight tracking-tight">Үйлчлүүлэгчид тань утаснаасаа цаг захиална</h1>
        <p className="text-lg text-muted">
          Үсчин, гоо сайхан, авто угаалга, эмнэлэг — 5 минутад бүртгүүлээд <strong className="text-ink">tsag.smartuvs.mn/таны-нэр</strong> хаягтай болно.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/signup" className="inline-flex min-h-12 items-center rounded-card bg-brand px-6 font-extrabold text-ink">Байгууллагаа бүртгүүлэх</Link>
          <Link href="/hatan-salon" className="inline-flex min-h-12 items-center rounded-card border border-line bg-white px-6 font-bold">Жишээ үзэх</Link>
        </div>
      </main>
    </div>
  );
}
