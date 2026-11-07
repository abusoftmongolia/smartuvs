"use client";
/** error.tsx-үүдэд хуваалцах алдааны харагдац — Next-ийн англи "Application error"-ийн оронд */
import { useEffect } from "react";

export function ErrorView({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Хувийн мэдээлэл агуулж болзошгүй тул зөвхөн digest-ийг логлоно
    console.error("[ui-error]", error.digest ?? error.name);
  }, [error]);
  return (
    <div role="alert" className="mx-auto flex max-w-md flex-col items-start gap-4 px-4 py-12">
      <h1 className="text-xl font-bold">Алдаа гарлаа</h1>
      <p className="text-sm text-muted">Хуудсыг ачаалж чадсангүй. Интернэт холболтоо шалгаад дахин оролдоно уу.</p>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={reset} className="min-h-12 rounded-card bg-brand px-5 font-semibold text-ink">
          Дахин оролдох
        </button>
        <a href="/" className="inline-flex min-h-12 items-center rounded-card border border-line px-5 text-sm font-medium">
          Нүүр хуудас
        </a>
      </div>
      {error.digest && <p className="text-xs text-muted">Алдааны код: {error.digest}</p>}
    </div>
  );
}

/** loading.tsx-үүдэд: сул сүлжээнд даралт мэдрэгдэхээр нэн даруй харагдана */
export function PageSkeleton({ label = "Ачаалж байна…" }: { label?: string }) {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-6" aria-busy="true">
      <p className="sr-only" role="status">{label}</p>
      <div aria-hidden className="h-8 w-56 animate-pulse rounded-lg bg-ground" />
      <div aria-hidden className="h-4 w-80 max-w-full animate-pulse rounded bg-ground" />
      <div aria-hidden className="grid gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((i) => <div key={i} className="h-28 animate-pulse rounded-card bg-ground" />)}
      </div>
      <div aria-hidden className="h-64 animate-pulse rounded-card bg-ground" />
    </div>
  );
}
