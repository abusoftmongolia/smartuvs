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
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={p.id} className="text-[13px] font-bold">{p.label}</label>
      <input
        id={p.id}
        name={p.id}
        type={p.type ?? "text"}
        value={p.value}
        onChange={(e) => p.onChange(e.target.value)}
        placeholder={p.placeholder}
        autoComplete={p.autoComplete}
        required={p.required}
        inputMode={p.type === "tel" ? "numeric" : undefined}
        className="min-h-12 rounded-xl border-[1.5px] border-[#d6d3cc] bg-white px-3.5 text-[15px] outline-none focus:border-ink"
      />
      {p.hint && <span className="text-xs text-muted">{p.hint}</span>}
    </div>
  );
}

export function ErrorBox({ children }: { children: React.ReactNode }) {
  return <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-800">{children}</p>;
}

export const btnPrimary =
  "inline-flex min-h-12 items-center justify-center rounded-card bg-brand px-5 text-base font-extrabold text-ink disabled:cursor-not-allowed disabled:opacity-50";
export const btnSecondary =
  "inline-flex min-h-11 items-center justify-center rounded-xl border border-line bg-white px-4 text-sm font-bold text-ink disabled:cursor-not-allowed disabled:opacity-50";
export const btnDanger =
  "inline-flex min-h-11 items-center justify-center rounded-xl border border-red-200 bg-white px-4 text-sm font-bold text-red-800 disabled:cursor-not-allowed disabled:opacity-50";
