"use client";
import { useState } from "react";
import { HoursEditor } from "@/components/HoursEditor";
import { btnPrimary, btnSecondary, selectCls } from "@/components/ui";
import type { DayHours } from "@/lib/hours";
import { addTimeOff, removeTimeOff, saveHours } from "@/server/settings-actions";
import { Panel } from "../../PageHeader";
import { num, useSave } from "../settings/shared";
import type { Off, Owner } from "../settings/types";

export function Hours({ slug, initial }: { slug: string; initial: DayHours[] }) {
  const [hours, setHours] = useState(initial);
  const { pending, save, status } = useSave();
  return (
    <Panel id="h-hours" title="Ажлын цаг">
      <p className="text-sm text-muted">Бүх ажилтан/бокст ижил хэрэглэгдэнэ. Аль хэдийн орсон захиалгад нөлөөлөхгүй.</p>
      <HoursEditor value={hours} onChange={setHours} />
      {status}
      <button type="button" disabled={pending} onClick={() => save(() => saveHours({ slug, hours }))} className={`${btnPrimary} self-start`}>
        {pending ? "Хадгалж байна…" : "Ажлын цаг хадгалах"}
      </button>
    </Panel>
  );
}

export function TimeOff({ slug, owners, list }: { slug: string; owners: Owner[]; list: Off[] }) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [ownerId, setOwnerId] = useState("");
  const [reason, setReason] = useState("");
  const { pending, save, status } = useSave();
  return (
    <Panel id="h-off" title="Чөлөө, баяр">
      <p className="text-sm text-muted">Энэ хугацаанд онлайн захиалга авахгүй. Аль хэдийн орсон захиалгыг календараас шилжүүлнэ үү.</p>
      {list.length > 0 && (
        <ul className="flex flex-col gap-2">
          {list.map((t) => (
            <li key={t.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-line p-3">
              <span className="flex-1 text-sm">
                <b>{t.from === t.to ? t.from : `${t.from} – ${t.to}`}</b>{t.partial ? " (цагаар)" : ""} · {t.owner ?? "Бүх байгууллага"}{t.reason ? ` · ${t.reason}` : ""}
              </span>
              <button type="button" disabled={pending} className={btnSecondary} onClick={() => save(() => removeTimeOff({ slug, id: t.id }), "Устгагдлаа")}>Устгах</button>
            </li>
          ))}
        </ul>
      )}
      <form className="flex flex-wrap items-end gap-2" onSubmit={(e) => {
        e.preventDefault();
        save(() => addTimeOff({ slug, from, to: to || from, ownerId: ownerId || null, reason }), "Нэмэгдлээ", () => { setFrom(""); setTo(""); setReason(""); });
      }}>
        <label className="flex flex-col gap-1 text-xs font-medium">Эхлэх
          <input type="date" required className={num} value={from} onChange={(e) => setFrom(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium">Дуусах
          <input type="date" className={num} value={to} min={from} onChange={(e) => setTo(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium">Хэн
          <select className={selectCls} value={ownerId} onChange={(e) => setOwnerId(e.target.value)}>
            <option value="">Бүх байгууллага</option>
            {owners.filter((o) => o.id).map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        </label>
        <label className="flex min-w-32 flex-1 flex-col gap-1 text-xs font-medium">Шалтгаан
          <input className={num} value={reason} placeholder="Цагаан сар" onChange={(e) => setReason(e.target.value)} />
        </label>
        <button disabled={pending || !from} className={btnPrimary}>Нэмэх</button>
      </form>
      {status}
    </Panel>
  );
}
