import { Suspense } from "react";
import { isTsagMaintenance } from "@/db/platform";
import { listPublicTenants } from "@/db/tenant";
import { INDUSTRY_PRESETS } from "@/lib/presets";
import { CategoryTiles } from "./_home/CategoryTiles";
import { Hero } from "./_home/Hero";
import { HomeHeader } from "./_home/HomeHeader";
import { SiteFooter } from "./_home/SiteFooter";
import { TenantDirectory } from "./TenantDirectory";

/** Шинэ байгууллага бүртгүүлэхэд revalidatePath("/") дуудагдана; бусад үед 5 минут тутам шинэчилнэ */
export const revalidate = 300;

/**
 * tsag.smartuvs.mn нүүр — uvsmarket.mn-тэй нэг загвар:
 * толгой (хайлт, салбарын цэс) → "3 алхмаар" баннер → салбарын хавтан → байгууллагууд → footer
 */
export default async function Home() {
  const [tenants, maintenance] = await Promise.all([listPublicTenants(), isTsagMaintenance()]);
  const industries = Object.values(INDUSTRY_PRESETS)
    .filter((p) => p.id !== "other")
    .map((p) => ({ id: p.id, label: p.label }));
  return (
    <div className="flex min-h-dvh flex-col bg-[#f4f4f4]">
      <HomeHeader industries={industries} />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-3 py-4 sm:gap-14 sm:px-6 sm:py-10">
        {maintenance && (
          <p role="status" className="rounded-card border-2 border-brand bg-brand-tint p-4 font-semibold">
            Систем засвартай байна — онлайн захиалга түр зогссон. Удахгүй сэргэнэ.
          </p>
        )}
        <Hero />
        <CategoryTiles />
        {/* useSearchParams (?q=, ?industry=) — хуудас статик хэвээр, шүүлт хөтөч дээр */}
        <Suspense>
          <TenantDirectory
            tenants={tenants.map((t) => ({ ...t, industryLabel: INDUSTRY_PRESETS[t.industry].label }))}
            industries={industries}
          />
        </Suspense>
      </main>
      <SiteFooter />
    </div>
  );
}
