/** Самбарын хуудасны толгой: гарчиг + тайлбар (+ баруун талд үйлдэл). Бүх хуудсанд ижил. */
export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: React.ReactNode }) {
  return (
    <div className="border-b border-line bg-white">
      <div className="mx-auto flex max-w-5xl flex-wrap items-end justify-between gap-3 px-4 py-5 sm:px-8">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
        </div>
        {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
      </div>
    </div>
  );
}

/** Хуудасны агуулгын хүрээ — толгойтой ижил өргөн */
export function PageBody({ children, wide }: { children: React.ReactNode; wide?: boolean }) {
  return <div className={`mx-auto flex flex-col gap-5 px-4 py-6 sm:px-8 ${wide ? "max-w-7xl" : "max-w-5xl"}`}>{children}</div>;
}

/** Цагаан карт (скриншотын загвар): гарчиг, тайлбар, агуулга */
export function Panel({ title, subtitle, children, id }: { title?: string; subtitle?: string; children: React.ReactNode; id?: string }) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-4 rounded-xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] sm:p-6">
      {title && (
        <div>
          <h2 id={id} className="text-base font-semibold">{title}</h2>
          {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
        </div>
      )}
      {children}
    </section>
  );
}
