import { SiteHeader } from "@/components/SiteHeader";

/**
 * Байгууллага өөрөө бүртгүүлэх — Үе шат 3-т хийнэ (CLAUDE.md).
 * Загвар: canvas-ын Signup.dc.html (4 алхам + "Бэлэн").
 * Логик: src/lib/slug.ts (uniqueSlug), src/lib/presets.ts (INDUSTRY_PRESETS, defaultSettings).
 */
export default function SignupPage() {
  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <h1 className="text-3xl font-extrabold">Байгууллагаа бүртгүүлэх</h1>
        <p className="mt-2 text-muted">Тун удахгүй.</p>
      </main>
    </div>
  );
}
