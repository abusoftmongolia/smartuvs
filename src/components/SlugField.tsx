"use client";
/**
 * Байгууллагын хаяг сонгох талбар: "tsag.smartuvs.mn/ [ulamjlalt]  ✓ Сул байна".
 * Бичих явцад кирилл → латин болгож, 400мс хүлээгээд сул эсэхийг серверээс шалгана.
 */
import { useEffect, useState } from "react";
import { inputCls } from "@/components/ui";
import { slugInput, slugProblem, SLUG_MAX } from "@/lib/slug";
import { checkSlug } from "@/server/slug-actions";

type Status = { kind: "idle" } | { kind: "checking" } | { kind: "ok" } | { kind: "error"; message: string };

export function SlugField(p: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  /** Тохиргооноос солиход одоогийн хаяг (өөрийнхөө хуучин хаяг руу буцахыг зөвшөөрнө) */
  currentSlug?: string;
  host: string;
  label?: string;
}) {
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const { value, currentSlug } = p;

  useEffect(() => {
    if (!value || value === currentSlug) return setStatus({ kind: "idle" });
    const problem = slugProblem(value);
    if (problem) return setStatus({ kind: "error", message: problem });
    setStatus({ kind: "checking" });
    let alive = true;
    const t = setTimeout(() => {
      checkSlug({ slug: value, currentSlug })
        .then((r) => alive && setStatus(r.ok ? { kind: "ok" } : { kind: "error", message: r.message }))
        .catch(() => alive && setStatus({ kind: "idle" }));
    }, 400);
    return () => { alive = false; clearTimeout(t); };
  }, [value, currentSlug]);

  const hintId = `${p.id}-hint`;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={p.id} className="text-sm font-medium">{p.label ?? "Захиалгын хуудасны хаяг"}</label>
      <div className={`flex min-h-12 items-center overflow-hidden ${inputCls} focus-within:border-ink`}>
        <span aria-hidden className="flex-none select-none pl-3.5 text-base text-muted">{p.host}/</span>
        <input
          id={p.id}
          name={p.id}
          value={value}
          onChange={(e) => p.onChange(slugInput(e.target.value))}
          maxLength={SLUG_MAX}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          aria-describedby={hintId}
          aria-invalid={status.kind === "error" || undefined}
          className="min-w-0 flex-1 bg-transparent py-2 pr-3.5 text-base font-medium outline-none"
        />
      </div>
      <span id={hintId} aria-live="polite" className="text-xs">
        {status.kind === "checking" && <span className="text-muted">Шалгаж байна…</span>}
        {status.kind === "ok" && <span className="font-semibold text-green-700">✓ Сул байна</span>}
        {status.kind === "error" && <span className="font-semibold text-red-700">{status.message}</span>}
        {status.kind === "idle" && <span className="text-muted">Богино, санахад амар хаяг сонгоорой. Латин үсэг, тоо, зураас (-).</span>}
      </span>
    </div>
  );
}
