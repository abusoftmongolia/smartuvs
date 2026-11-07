"use client";
import { useState } from "react";
import { btnPrimary, btnSecondary } from "@/components/ui";
import { saveOwner } from "@/server/settings-actions";
import { Panel } from "../../PageHeader";
import { newKey, num, useSave } from "../settings/shared";
import type { Owner } from "../settings/types";

type Item = Owner & { key: string };
const toItem = (o: Owner): Item => ({ ...o, key: o.id ?? newKey() });

export function Owners({ slug, term, initial }: { slug: string; term: string; initial: Owner[] }) {
  const [list, setList] = useState<Item[]>(() => initial.map(toItem));
  const [editing, setEditing] = useState<{ key: string; name: string } | null>(null);
  const { pending, save, status } = useSave();
  const patch = (key: string, p: Partial<Item>) => setList((l) => l.map((o) => (o.key === key ? { ...o, ...p } : o)));

  function cancelEdit() {
    if (editing) setList((l) => l.filter((o) => o.key !== editing.key || o.id));
    setEditing(null);
  }

  function submit(o: Item, name: string) {
    const { key: _key, ...payload } = o;
    save(() => saveOwner({ slug, ...payload, name }), "Хадгалагдлаа", (r) => {
      patch(o.key, { name, id: r.id ?? o.id });
      setEditing(null);
    });
  }

  function toggle(o: Item) {
    const before = o.active;
    patch(o.key, { active: !before });
    const { key: _key, ...payload } = o;
    save(() => saveOwner({ slug, ...payload, active: !before }), "Хадгалагдлаа", undefined, () => patch(o.key, { active: before }));
  }

  return (
    <Panel id="h-own" title={term}>
      <ul className="flex flex-col gap-2">
        {list.map((o) => (
          <li key={o.key} className={`flex flex-wrap items-center gap-2 rounded-xl border border-line p-3 ${o.active ? "" : "opacity-60"}`}>
            {editing?.key === o.key ? (
              <form className="flex flex-1 flex-wrap items-end gap-2" onSubmit={(e) => { e.preventDefault(); submit(o, editing.name); }}>
                <label className="flex min-w-40 flex-1 flex-col gap-1 text-xs font-medium">Нэр
                  <input className={num} value={editing.name} onChange={(e) => setEditing({ key: o.key, name: e.target.value })} />
                </label>
                <button disabled={pending} className={btnPrimary}>Хадгалах</button>
                <button type="button" disabled={pending} className={btnSecondary} onClick={cancelEdit}>Болих</button>
              </form>
            ) : (
              <>
                <span className="flex-1 font-medium">{o.name}{!o.active && <span className="font-normal text-muted"> · идэвхгүй</span>}</span>
                <button type="button" className={btnSecondary} onClick={() => setEditing({ key: o.key, name: o.name })}>Засах</button>
                {o.id && (
                  <button type="button" className={btnSecondary} disabled={pending} onClick={() => toggle(o)}>
                    {o.active ? "Идэвхгүй болгох" : "Идэвхжүүлэх"}
                  </button>
                )}
              </>
            )}
          </li>
        ))}
      </ul>
      {status}
      <button type="button" className={`${btnSecondary} self-start`} disabled={editing != null} onClick={() => {
        const o = toItem({ name: "", title: "", active: true });
        setList((l) => [...l, o]);
        setEditing({ key: o.key, name: "" });
      }}>
        + {term} нэмэх
      </button>
    </Panel>
  );
}
