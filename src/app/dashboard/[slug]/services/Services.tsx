"use client";
import { useState } from "react";
import { btnPrimary, btnSecondary } from "@/components/ui";
import { saveService } from "@/server/settings-actions";
import { Panel } from "../../PageHeader";
import { NumInput, newKey, num, useSave } from "../settings/shared";
import type { Svc } from "../settings/types";

type Item = Svc & { key: string };
/** Засаж буй мөрийн ноорог — тоон талбар хоосон байж болно */
type Draft = { name: string; durationMin: number | null; bufferMin: number | null; price: number | null };

const toItem = (s: Svc): Item => ({ ...s, key: s.id ?? newKey() });

export function Services({ slug, initial }: { slug: string; initial: Svc[] }) {
  const [list, setList] = useState<Item[]>(() => initial.map(toItem));
  const [editing, setEditing] = useState<{ key: string; draft: Draft } | null>(null);
  const { pending, save, fail, status } = useSave();
  const patch = (key: string, p: Partial<Item>) => setList((l) => l.map((s) => (s.key === key ? { ...s, ...p } : s)));
  const setDraft = (p: Partial<Draft>) => setEditing((e) => (e ? { ...e, draft: { ...e.draft, ...p } } : e));

  function startEdit(s: Item) {
    setEditing({ key: s.key, draft: { name: s.name, durationMin: s.durationMin, bufferMin: s.bufferMin, price: s.price } });
  }

  function cancelEdit() {
    // Хадгалаагүй шинэ мөрийг жагсаалтаас хасна
    if (editing) setList((l) => l.filter((s) => s.key !== editing.key || s.id));
    setEditing(null);
  }

  function submit(s: Item, d: Draft) {
    if (d.durationMin == null) return fail("Үргэлжлэх минутаа оруулна уу");
    if (d.bufferMin == null) return fail("Завсрын минутаа оруулна уу (байхгүй бол 0)");
    const next = { ...s, name: d.name, durationMin: d.durationMin, bufferMin: d.bufferMin, price: d.price };
    const { key: _key, ...payload } = next;
    save(() => saveService({ slug, ...payload }), "Хадгалагдлаа", (r) => {
      patch(s.key, { ...next, id: r.id ?? s.id });
      setEditing(null);
    });
  }

  function toggle(s: Item) {
    const before = s.active;
    patch(s.key, { active: !before });
    const { key: _key, ...payload } = s;
    // Сервер татгалзвал буцаана
    save(() => saveService({ slug, ...payload, active: !before }), "Хадгалагдлаа", undefined, () => patch(s.key, { active: before }));
  }

  return (
    <Panel id="h-svc" title="Үйлчилгээ">
      <ul className="flex flex-col gap-2">
        {list.map((s) => (
          <li key={s.key} className={`flex flex-col gap-2 rounded-xl border border-line p-3 ${s.active ? "" : "opacity-60"}`}>
            {editing?.key === s.key ? (
              <form className="flex flex-wrap items-end gap-2" onSubmit={(e) => { e.preventDefault(); submit(s, editing.draft); }}>
                <label className="flex min-w-40 flex-[2] flex-col gap-1 text-xs font-medium">Нэр
                  <input className={num} value={editing.draft.name} onChange={(e) => setDraft({ name: e.target.value })} />
                </label>
                <label className="flex w-20 flex-col gap-1 text-xs font-medium">Минут
                  <NumInput min={5} value={editing.draft.durationMin} onChange={(x) => setDraft({ durationMin: x })} />
                </label>
                <label className="flex w-20 flex-col gap-1 text-xs font-medium">Завсар
                  <NumInput min={0} value={editing.draft.bufferMin} onChange={(x) => setDraft({ bufferMin: x })} />
                </label>
                <label className="flex w-28 flex-col gap-1 text-xs font-medium">Үнэ ₮
                  <input inputMode="numeric" className={num} value={editing.draft.price ?? ""} placeholder="—"
                    onChange={(e) => { const d = e.target.value.replace(/\D/g, ""); setDraft({ price: d ? Number(d) : null }); }} />
                </label>
                <button disabled={pending} className={btnPrimary}>Хадгалах</button>
                <button type="button" disabled={pending} className={btnSecondary} onClick={cancelEdit}>Болих</button>
              </form>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex-1 font-medium">{s.name} <span className="font-normal text-muted">· {s.durationMin} мин{s.price != null ? ` · ₮${s.price.toLocaleString("en-US")}` : ""}</span></span>
                <button type="button" className={btnSecondary} onClick={() => startEdit(s)}>Засах</button>
                {s.id && (
                  <button type="button" className={btnSecondary} disabled={pending} onClick={() => toggle(s)}>
                    {s.active ? "Нуух" : "Идэвхжүүлэх"}
                  </button>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
      {status}
      <button type="button" className={`${btnSecondary} self-start`} disabled={editing != null} onClick={() => {
        const s = toItem({ name: "", durationMin: 30, bufferMin: 5, price: null, active: true });
        setList((l) => [...l, s]);
        startEdit(s);
      }}>
        + Үйлчилгээ нэмэх
      </button>
    </Panel>
  );
}
