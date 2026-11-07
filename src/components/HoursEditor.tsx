"use client";
/** Долоо хоногийн ажлын цаг засагч — бүртгэл ба тохиргоонд. */
import { formatHm } from "@/lib/time";
import { parseHm, type DayHours } from "@/lib/hours";

const NAMES: Record<number, string> = { 0: "Ням", 1: "Даваа", 2: "Мягмар", 3: "Лхагва", 4: "Пүрэв", 5: "Баасан", 6: "Бямба" };
const hm = (m: number | null) => (m == null ? "" : formatHm(m));
const input = "min-h-11 w-[6.5rem] rounded-lg border-[1.5px] border-field bg-white px-2 text-sm";

export function HoursEditor({ value, onChange }: { value: DayHours[]; onChange: (v: DayHours[]) => void }) {
  const set = (i: number, patch: Partial<DayHours>) => onChange(value.map((d, j) => (j === i ? { ...d, ...patch } : d)));
  const copyMonday = () => {
    const mon = value.find((d) => d.weekday === 1);
    if (!mon) return;
    onChange(value.map((d) => (d.weekday >= 2 && d.weekday <= 5 ? { ...mon, weekday: d.weekday } : d)));
  };

  return (
    <div className="flex flex-col gap-2">
      {value.map((d, i) => (
        <fieldset key={d.weekday} className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-line bg-white p-3">
          <legend className="sr-only">{NAMES[d.weekday]}</legend>
          <label className="flex min-h-11 w-28 items-center gap-2 text-sm font-medium">
            <input type="checkbox" checked={d.open} onChange={(e) => set(i, { open: e.target.checked })} className="size-5 accent-[#f5a800]" />
            {NAMES[d.weekday]}
          </label>
          {d.open ? (
            <>
              <span className="flex items-center gap-1.5 text-sm">
                <input type="time" aria-label={`${NAMES[d.weekday]} эхлэх`} value={hm(d.start)} step={900}
                  onChange={(e) => { const m = parseHm(e.target.value); if (m != null) set(i, { start: m }); }} className={input} />
                –
                <input type="time" aria-label={`${NAMES[d.weekday]} дуусах`} value={hm(d.end)} step={900}
                  onChange={(e) => { const m = parseHm(e.target.value); if (m != null) set(i, { end: m === 0 ? 1440 : m }); }} className={input} />
              </span>
              {d.breakStart != null ? (
                <span className="flex flex-wrap items-center gap-1.5 text-sm text-muted">
                  Завсарлага
                  <input type="time" aria-label={`${NAMES[d.weekday]} завсарлага эхлэх`} value={hm(d.breakStart)} step={900}
                    onChange={(e) => { const m = parseHm(e.target.value); if (m != null) set(i, { breakStart: m }); }} className={input} />
                  –
                  <input type="time" aria-label={`${NAMES[d.weekday]} завсарлага дуусах`} value={hm(d.breakEnd)} step={900}
                    onChange={(e) => { const m = parseHm(e.target.value); if (m != null) set(i, { breakEnd: m }); }} className={input} />
                  <button type="button" onClick={() => set(i, { breakStart: null, breakEnd: null })}
                    className="inline-flex min-h-11 items-center px-2 text-sm font-semibold text-brand-deep underline">Хасах</button>
                </span>
              ) : (
                <button type="button" onClick={() => set(i, { breakStart: Math.min(d.start + 240, d.end - 60), breakEnd: Math.min(d.start + 300, d.end - 30) })}
                  className="inline-flex min-h-11 items-center px-2 text-sm font-semibold text-brand-deep underline">+ Завсарлага</button>
              )}
            </>
          ) : (
            <span className="text-sm text-muted">Амарна</span>
          )}
        </fieldset>
      ))}
      <button type="button" onClick={copyMonday} className="self-start text-sm font-semibold text-brand-deep underline min-h-11">
        Даваагийн цагийг Мягмар–Баасанд хуулах
      </button>
    </div>
  );
}
