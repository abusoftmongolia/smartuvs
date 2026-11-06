import Link from "next/link";
import { Suspense } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { isTsagMaintenance } from "@/db/platform";
import { listPublicTenants } from "@/db/tenant";
import { INDUSTRY_PRESETS } from "@/lib/presets";
import { TenantDirectory } from "./TenantDirectory";

/** Шинэ байгууллага бүртгүүлэхэд revalidatePath("/") дуудагдана; бусад үед 5 минут тутам шинэчилнэ */
export const revalidate = 300;

/** tsag.smartuvs.mn нүүр — үйлчлүүлэгч байгууллагаа сонгоод цаг захиална */
export default async function Home() {
  const [tenants, maintenance] = await Promise.all([listPublicTenants(), isTsagMaintenance()]);
  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6">
        <div>
          <h1 className="text-2xl font-bold leading-tight tracking-tight sm:text-3xl">Цаг захиалах</h1>
          <p className="mt-1 text-sm text-muted">Байгууллагаа сонгоод утаснаасаа захиална. Төлбөргүй, бүртгэл шаардахгүй.</p>
        </div>

        {maintenance && (
          <p role="status" className="rounded-card border-2 border-brand bg-brand-tint p-4 font-semibold">
            Систем засвартай байна — онлайн захиалга түр зогссон. Удахгүй сэргэнэ.
          </p>
        )}
        {/* useSearchParams (?q=) — хуудас статик хэвээр, хайлт хөтөч дээр */}
        <Suspense>
          <TenantDirectory
            tenants={tenants.map((t) => ({ ...t, industryLabel: INDUSTRY_PRESETS[t.industry].label }))}
            industries={Object.values(INDUSTRY_PRESETS).map((p) => ({ id: p.id, label: p.label }))}
          />
        </Suspense>

        <section aria-labelledby="h-biz" className="mt-4 flex flex-col items-start gap-3 rounded-[18px] border border-line bg-white p-5">
          <h2 id="h-biz" className="text-lg font-semibold">Байгууллага эрхэлдэг үү?</h2>
          <p className="text-sm text-muted">
            Үсчин, гоо сайхан, шүдний эмнэлэг, фитнесс — 5 минутад үнэгүй бүртгүүлээд <strong className="text-ink">tsag.smartuvs.mn/таны-нэр</strong> хаягтай болно.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link href="/signup" className="inline-flex min-h-12 items-center rounded-card bg-brand px-5 font-semibold text-ink">Байгууллагаа бүртгүүлэх</Link>
            <Link href="/business" className="inline-flex min-h-12 items-center rounded-card border border-line bg-white px-5 font-medium">Дэлгэрэнгүй</Link>
            <Link href="/admin/login" className="inline-flex min-h-12 items-center rounded-card border border-line bg-white px-5 font-medium">Байгууллага нэвтрэх</Link>
          </div>
        </section>
      </main>
    </div>
  );
}
