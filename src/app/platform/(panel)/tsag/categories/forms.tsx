"use client";
import { useState } from "react";
import type { Industry } from "@/lib/industries";
import type { ResolvedIndustry, Tile } from "@/lib/site-config";
import { saveIndustries, saveTiles } from "@/server/content-actions";
import { inputCls, MoveButtons, move, SaveBar, useSaver, VisibleSwitch } from "../content-ui";

/** Салбарууд: нэр, дараалал, нүүрний цэс/шүүлтүүрт харагдах эсэх */
export function IndustriesForm({ initial }: { initial: ResolvedIndustry[] }) {
  const [rows, setRows] = useState(initial);
  const s = useSaver();
  const dirty = JSON.stringify(rows) !== JSON.stringify(initial);
  const movable = rows.filter((r) => r.id !== "other");
  const other = rows.find((r) => r.id === "other");
  const update = (id: Industry, patch: Partial<ResolvedIndustry>) => { s.clear(); setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r))); };

  return (
    <form className="flex flex-col gap-3" onSubmit={(e) => {
      e.preventDefault();
      s.run(() => saveIndustries({
        order: rows.map((r) => r.id),
        labels: Object.fromEntries(rows.filter((r) => r.label.trim() && r.label.trim() !== r.defaultLabel).map((r) => [r.id, r.label.trim()])),
        hidden: rows.filter((r) => r.hidden).map((r) => r.id),
      }));
    }}>
      <ol className="flex flex-col gap-2">
        {[...movable, ...(other ? [other] : [])].map((r, i) => (
          <li key={r.id} className={`flex flex-wrap items-center gap-2 rounded-2xl border border-line p-2.5 sm:flex-nowrap sm:gap-3 ${r.hidden ? "bg-ground" : "bg-white"}`}>
            <span aria-hidden className="w-6 flex-none text-center text-sm font-semibold tabular-nums text-muted">{i + 1}</span>
            <label className="min-w-0 flex-1">
              <span className="sr-only">{r.defaultLabel} — харагдах нэр</span>
              <input value={r.label} maxLength={40} onChange={(e) => update(r.id, { label: e.target.value })} placeholder={r.defaultLabel}
                className={`${inputCls} ${r.hidden ? "text-muted" : ""}`} />
            </label>
            {r.label.trim() !== r.defaultLabel && <span className="hidden text-xs text-muted lg:inline">анх: {r.defaultLabel}</span>}
            {r.id === "other" ? (
              <span className="px-2 text-xs text-muted">Үргэлж сүүлд, цэсэнд гарахгүй</span>
            ) : (
              <span className="ml-auto flex items-center gap-2">
                <VisibleSwitch on={!r.hidden} onChange={(v) => update(r.id, { hidden: !v })} label={r.label || r.defaultLabel} />
                <MoveButtons index={i} length={movable.length} label={r.label || r.defaultLabel}
                  onMove={(a, b) => { s.clear(); setRows([...move(movable, a, b), ...(other ? [other] : [])]); }} />
              </span>
            )}
          </li>
        ))}
      </ol>
      <p className="text-sm text-muted">Нуусан салбарын байгууллагууд жагсаалтад харагдсаар байна — зөвхөн цэс, шүүлтүүрээс хасагдана. Шинэ салбар нэмэхэд хөгжүүлэлт шаардлагатай (бүртгэлийн preset).</p>
      <SaveBar pending={s.pending} msg={s.msg} dirty={dirty} onReset={() => { setRows(initial); s.clear(); }} />
    </form>
  );
}

/** Нүүрний 3 том ангиллын хавтан: гарчиг, тайлбар, ямар салбаруудыг шүүх */
export function TilesForm({ initial, industries }: { initial: Tile[]; industries: { id: Industry; label: string }[] }) {
  const [tiles, setTiles] = useState(initial);
  const s = useSaver();
  const dirty = JSON.stringify(tiles) !== JSON.stringify(initial);
  const set = (i: number, patch: Partial<Tile>) => { s.clear(); setTiles((ts) => ts.map((t, j) => (j === i ? { ...t, ...patch } : t))); };
  const LOOK = ["bg-brand text-ink", "bg-ink text-white", "bg-[#ece9e1] text-ink"];

  return (
    <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); s.run(() => saveTiles({ tiles })); }}>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {tiles.map((t, i) => (
          <fieldset key={i} className="flex min-w-0 flex-col gap-3 rounded-2xl border border-line p-4">
            <legend className="sr-only">Хавтан {i + 1}</legend>
            <div className={`flex h-20 flex-col justify-end rounded-xl p-3 ${LOOK[i]}`} aria-hidden>
              <span className="truncate text-xs opacity-80">{t.kicker || "—"}</span>
              <span className="truncate text-lg font-bold">{t.title || "Гарчиг"}</span>
            </div>
            <label className="flex flex-col gap-1 text-sm font-medium">Гарчиг
              <input value={t.title} maxLength={40} onChange={(e) => set(i, { title: e.target.value })} className={inputCls} />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium">Тайлбар
              <input value={t.kicker} maxLength={60} onChange={(e) => set(i, { kicker: e.target.value })} className={inputCls} />
            </label>
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium" id={`tile-${i}-ind`}>Хамаарах салбар</span>
              <div role="group" aria-labelledby={`tile-${i}-ind`} className="flex flex-wrap gap-1.5">
                {industries.map((ind) => {
                  const on = t.industries.includes(ind.id);
                  return (
                    <label key={ind.id} className={`inline-flex min-h-10 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-sm ${on ? "border-ink bg-ink text-white" : "border-line bg-white"}`}>
                      <input type="checkbox" className="sr-only" checked={on}
                        onChange={() => set(i, { industries: on ? t.industries.filter((x) => x !== ind.id) : [...t.industries, ind.id] })} />
                      {on && <span aria-hidden>✓</span>}{ind.label}
                    </label>
                  );
                })}
              </div>
            </div>
          </fieldset>
        ))}
      </div>
      <SaveBar pending={s.pending} msg={s.msg} dirty={dirty} onReset={() => { setTiles(initial); s.clear(); }} />
    </form>
  );
}
