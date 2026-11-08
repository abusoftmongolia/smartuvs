"use client";
import { useState } from "react";
import { DEFAULT_MENU, MenuHref, type MenuItem } from "@/lib/site-config";
import { saveMenu } from "@/server/content-actions";
import { inputCls, MoveButtons, move, SaveBar, useSaver, VisibleSwitch } from "../content-ui";

const MAX_ITEMS = 20;

export function MenuForm({ initial }: { initial: MenuItem[] }) {
  const [items, setItems] = useState(initial);
  const s = useSaver();
  const dirty = JSON.stringify(items) !== JSON.stringify(initial);
  const set = (id: string, patch: Partial<MenuItem>) => { s.clear(); setItems((xs) => xs.map((x) => (x.id === id ? { ...x, ...patch } : x))); };
  const add = () => {
    s.clear();
    setItems((xs) => [...xs, { id: `l-${Date.now().toString(36)}`, kind: "link", label: "", href: "/", visible: true, accent: false }]);
  };

  return (
    <form className="flex flex-col gap-3" onSubmit={(e) => { e.preventDefault(); s.run(() => saveMenu({ items })); }}>
      <ol className="flex flex-col gap-2">
        {items.map((it, i) => {
          const name = it.label || "Шинэ холбоос";
          const hrefBad = it.kind === "link" && !MenuHref.safeParse(it.href).success;
          return (
            <li key={it.id} className={`flex flex-col gap-2 rounded-2xl border p-3 lg:flex-row lg:items-center ${it.visible ? "border-line bg-white" : "border-line bg-ground"}`}>
              {it.kind === "industries" ? (
                <div className="min-w-0 flex-1">
                  <div className="font-semibold">Салбарууд <span className="ml-1 rounded-md bg-ground px-1.5 py-0.5 text-xs font-medium text-muted">автомат</span></div>
                  <div className="text-sm text-muted">Ангилал хуудасны харагдах салбарууд энд дарааллаараа гарна</div>
                </div>
              ) : (
                <div className="grid min-w-0 flex-1 grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
                  <label className="flex flex-col gap-1 text-xs font-medium text-muted">Нэр
                    <input value={it.label} maxLength={40} required onChange={(e) => set(it.id, { label: e.target.value })} className={`${inputCls} text-ink`} />
                  </label>
                  <label className="flex flex-col gap-1 text-xs font-medium text-muted">Холбоос
                    <input value={it.href} maxLength={200} onChange={(e) => set(it.id, { href: e.target.value.trim() })} placeholder="/business эсвэл https://…"
                      aria-invalid={hrefBad || undefined} className={`${inputCls} text-ink ${hrefBad ? "border-red-700" : ""}`} />
                  </label>
                </div>
              )}
              <div className="flex flex-wrap items-center gap-2 lg:flex-nowrap">
                {it.kind === "link" && (
                  <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl px-2 text-sm font-medium">
                    <input type="checkbox" checked={it.accent} onChange={(e) => set(it.id, { accent: e.target.checked })} className="size-5 accent-[#0b0b0b]" />
                    Онцлох
                  </label>
                )}
                <VisibleSwitch on={it.visible} onChange={(v) => set(it.id, { visible: v })} label={name} />
                <MoveButtons index={i} length={items.length} label={name} onMove={(a, b) => { s.clear(); setItems(move(items, a, b)); }} />
                {it.kind === "link" && (
                  <button type="button" aria-label={`${name}: устгах`} onClick={() => { s.clear(); setItems((xs) => xs.filter((x) => x.id !== it.id)); }}
                    className="inline-flex size-11 items-center justify-center rounded-xl border border-line bg-white text-red-700">
                    <svg aria-hidden width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" /></svg>
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ol>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={add} disabled={items.length >= MAX_ITEMS}
          className="inline-flex min-h-11 items-center rounded-xl border border-ink bg-white px-4 text-sm font-semibold disabled:opacity-40">+ Холбоос нэмэх</button>
        {!items.some((x) => x.kind === "industries") && (
          <button type="button" onClick={() => setItems((xs) => [...xs, DEFAULT_MENU.items.find((x) => x.kind === "industries")!])}
            className="inline-flex min-h-11 items-center rounded-xl border border-line bg-white px-4 text-sm font-medium">+ Салбаруудыг буцааж нэмэх</button>
        )}
        <button type="button" onClick={() => { s.clear(); setItems(DEFAULT_MENU.items); }}
          className="ml-auto inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-medium text-muted hover:bg-ground">Анхны цэс сэргээх</button>
      </div>
      <p className="text-sm text-muted">«Онцлох» холбоос шар-хүрэн өнгөөр, цэсийн баруун талд гарна. Утсанд салбарууд «Салбар», бусад холбоос «Цэс» хэсэгт харагдана.</p>
      <SaveBar pending={s.pending} msg={s.msg} dirty={dirty} onReset={() => { setItems(initial); s.clear(); }} />
    </form>
  );
}
