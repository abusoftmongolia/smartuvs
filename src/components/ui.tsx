/** Жижиг нийтлэг UI хэсгүүд (server болон client аль алинд). */

export function Field(p: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  hint?: string;
  autoComplete?: string;
  required?: boolean;
  /** form-ын нэр (autofill-д); өгөөгүй бол id */
  name?: string;
}) {
  const hintId = p.hint ? `${p.id}-hint` : undefined;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={p.id} className="text-sm font-medium">{p.label}</label>
      <input
        id={p.id}
        name={p.name ?? p.id}
        type={p.type ?? "text"}
        value={p.value}
        onChange={(e) => p.onChange(e.target.value)}
        placeholder={p.placeholder}
        autoComplete={p.autoComplete}
        required={p.required}
        aria-describedby={hintId}
        inputMode={p.type === "tel" ? "numeric" : undefined}
        className={`min-h-12 px-3.5 text-base ${inputCls}`}
      />
      {p.hint && <span id={hintId} className="text-xs text-muted">{p.hint}</span>}
    </div>
  );
}

/** Input/select-ийн нийтлэг хүрээ — хэмжээ (min-h, px, text)-ийг хэрэглэх газар нэмнэ */
export const inputCls = "rounded-xl border-[1.5px] border-field bg-white focus:border-ink";
export const selectCls = `min-h-12 px-3 text-sm font-normal ${inputCls}`;

/** dl доторх "Түлхүүр — утга" мөр (тойм, захиалгын дэлгэрэнгүй) */
export function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-xs text-muted">{k}</dt>
      <dd className="text-right font-medium">{v}</dd>
    </div>
  );
}

/** Амжилтын ✓ тэмдэг (захиалга, бүртгэл дууссан) */
export function SuccessMark() {
  return (
    <div aria-hidden className="flex size-16 items-center justify-center rounded-full bg-ink text-brand">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
    </div>
  );
}

export function ErrorBox({ children }: { children: React.ReactNode }) {
  return <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-800">{children}</p>;
}

export const btnPrimary =
  "inline-flex min-h-12 items-center justify-center rounded-card bg-brand px-5 text-[15px] font-semibold text-ink disabled:cursor-not-allowed disabled:opacity-50";
export const btnSecondary =
  "inline-flex min-h-11 items-center justify-center rounded-xl border border-line bg-white px-4 text-sm font-medium text-ink disabled:cursor-not-allowed disabled:opacity-50";
export const btnDanger =
  "inline-flex min-h-11 items-center justify-center rounded-xl border border-red-200 bg-white px-4 text-sm font-medium text-red-800 disabled:cursor-not-allowed disabled:opacity-50";
