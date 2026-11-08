"use client";
/** Агуулга удирдах формуудын нийтлэг хэсэг: хадгалах товч + төлөв, дээш/доош зөөх товч */
import { useState, useTransition } from "react";

type Result = { ok: true } | { ok: false; message: string };

export function useSaver() {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const run = (fn: () => Promise<Result>) =>
    start(async () => {
      setMsg(null);
      try {
        const r = await fn();
        setMsg(r.ok ? { ok: true, text: "Хадгалагдлаа. Нүүр хуудсанд шууд харагдана." } : { ok: false, text: r.message });
      } catch {
        setMsg({ ok: false, text: "Алдаа гарлаа. Дахин оролдоно уу." });
      }
    });
  return { pending, msg, run, clear: () => setMsg(null) };
}

export function SaveBar({ pending, msg, dirty, onReset }: { pending: boolean; msg: { ok: boolean; text: string } | null; dirty: boolean; onReset: () => void }) {
  return (
    <div className="sticky bottom-0 -mx-5 -mb-5 flex flex-wrap items-center gap-3 rounded-b-[22px] border-t border-line bg-white/95 px-5 py-3 backdrop-blur sm:-mx-6 sm:-mb-6 sm:px-6">
      <button type="submit" disabled={pending || !dirty}
        className="inline-flex min-h-11 items-center rounded-xl bg-brand px-5 text-sm font-semibold text-ink disabled:opacity-50">
        {pending ? "Хадгалж байна…" : "Хадгалах"}
      </button>
      {dirty && !pending && (
        <button type="button" onClick={onReset} className="inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-medium text-muted hover:bg-ground">Буцаах</button>
      )}
      <span role="status" aria-live="polite" className={`text-sm font-medium ${msg?.ok ? "text-green-700" : "text-red-700"}`}>{msg?.text}</span>
    </div>
  );
}

export function MoveButtons({ index, length, onMove, label }: { index: number; length: number; onMove: (from: number, to: number) => void; label: string }) {
  const btn = "inline-flex size-11 items-center justify-center rounded-xl border border-line bg-white text-ink disabled:opacity-30";
  return (
    <span className="flex flex-none gap-1">
      <button type="button" className={btn} disabled={index === 0} onClick={() => onMove(index, index - 1)} aria-label={`${label}: дээш`}>
        <svg aria-hidden width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 15 6-6 6 6" /></svg>
      </button>
      <button type="button" className={btn} disabled={index === length - 1} onClick={() => onMove(index, index + 1)} aria-label={`${label}: доош`}>
        <svg aria-hidden width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
      </button>
    </span>
  );
}

export function move<T>(list: T[], from: number, to: number): T[] {
  const next = [...list];
  const [x] = next.splice(from, 1);
  next.splice(to, 0, x);
  return next;
}

/** Харагдах/нуух унтраалга (role=switch) */
export function VisibleSwitch({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={`${label}: ${on ? "харагдана" : "нуусан"}`} onClick={() => onChange(!on)}
      className={`relative inline-flex h-8 w-14 flex-none items-center rounded-full p-1 transition-colors before:absolute before:-inset-1.5 before:content-[''] ${on ? "bg-ink" : "bg-line"}`}>
      <span className={`size-6 rounded-full shadow transition-transform ${on ? "translate-x-6 bg-brand" : "translate-x-0 bg-white"}`} />
    </button>
  );
}

export const inputCls = "min-h-11 w-full min-w-0 rounded-xl border border-field bg-white px-3 text-base outline-none focus:border-ink";
