"use client";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { ErrorBox, btnDanger, btnPrimary, btnSecondary } from "@/components/ui";
import type { ChangeBlock } from "@/lib/policy";
import { cancelByCustomer, manageSlots, rescheduleByCustomer } from "@/server/manage-actions";

type Day = { date: string; wd: string; num: string; sub: string };

export function ManageBooking(p: {
  token: string;
  active: boolean;
  block: ChangeBlock;
  cancellationHours: number;
  tenantPhone: string | null;
  slug: string;
  days: Day[];
  currentDate: string;
}) {
  const [mode, setMode] = useState<"view" | "move" | "confirmCancel">("view");
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const run = (fn: () => Promise<{ ok: true } | { ok: false; message: string }>, okText: string) =>
    start(async () => {
      setError(null);
      const r = await fn();
      if (r.ok) { setDone(okText); setMode("view"); }
      else setError(r.message);
    });

  if (!p.active) {
    return (
      <div className="flex flex-col gap-3">
        {done && <p role="status" className="rounded-xl bg-green-50 p-3 text-sm font-semibold text-green-800">✓ {done}</p>}
        <Link href={`/${p.slug}`} className={btnPrimary}>Шинээр цаг захиалах</Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {done && <p role="status" className="rounded-xl bg-green-50 p-3 text-sm font-semibold text-green-800">✓ {done}</p>}
      {error && <ErrorBox>{error}</ErrorBox>}

      <a href={`/manage/${p.token}/ics`} className={btnSecondary}>📅 Календарьт нэмэх</a>

      {p.block === "too_late" ? (
        <p className="rounded-xl bg-ground p-4 text-sm">
          Эхлэхэд {p.cancellationHours} цагаас бага хугацаа үлдсэн тул өөрчлөхийн тулд байгууллага руу залгана уу.
          {p.tenantPhone && <> <a href={`tel:${p.tenantPhone}`} className="font-bold underline">{p.tenantPhone}</a></>}
        </p>
      ) : mode === "move" ? (
        <MovePicker token={p.token} days={p.days} initialDate={p.currentDate} busy={pending}
          onCancel={() => setMode("view")}
          onPick={(date, startMin) => run(() => rescheduleByCustomer({ token: p.token, date, startMin }), "Цаг шилжлээ")} />
      ) : mode === "confirmCancel" ? (
        <div className="flex flex-col gap-3 rounded-xl border border-red-200 bg-white p-4">
          <p className="font-bold">Захиалгаа цуцлах уу?</p>
          <div className="flex gap-2">
            <button disabled={pending} onClick={() => run(() => cancelByCustomer(p.token), "Захиалга цуцлагдлаа")} className={`${btnDanger} flex-1`}>
              {pending ? "Түр хүлээнэ үү…" : "Тийм, цуцлах"}
            </button>
            <button disabled={pending} onClick={() => setMode("view")} className={`${btnSecondary} flex-1`}>Үгүй</button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <button onClick={() => setMode("move")} className={`${btnSecondary} flex-1`}>Өөр цаг сонгох</button>
          <button onClick={() => setMode("confirmCancel")} className={`${btnDanger} flex-1`}>Цуцлах</button>
        </div>
      )}
    </div>
  );
}

function MovePicker(p: {
  token: string;
  days: Day[];
  initialDate: string;
  busy: boolean;
  onCancel: () => void;
  onPick: (date: string, startMin: number) => void;
}) {
  const [date, setDate] = useState(p.days.some((d) => d.date === p.initialDate) ? p.initialDate : (p.days[0]?.date ?? ""));
  const [slots, setSlots] = useState<{ label: string; startMin: number }[] | null>(null);
  const [startMin, setStartMin] = useState<number | null>(null);

  useEffect(() => {
    let live = true;
    setSlots(null);
    setStartMin(null);
    manageSlots({ token: p.token, date }).then((s) => live && setSlots(s)).catch(() => live && setSlots([]));
    return () => { live = false; };
  }, [p.token, date]);

  return (
    <div className="flex flex-col gap-3 rounded-[18px] border border-line bg-white p-4">
      <h2 className="font-extrabold">Шинэ цаг</h2>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {p.days.map((d) => (
          <button key={d.date} onClick={() => setDate(d.date)} aria-pressed={d.date === date} aria-label={d.date}
            className={`flex min-h-[64px] w-14 flex-none flex-col items-center justify-center rounded-card border-[1.5px] ${d.date === date ? "border-brand bg-brand" : "border-line bg-white"}`}>
            <span className="text-xs font-bold">{d.wd}</span>
            <span className="text-lg font-extrabold">{d.num}</span>
            <span className="text-[10px] font-semibold">{d.sub}</span>
          </button>
        ))}
      </div>
      {slots === null ? (
        <p className="text-sm text-muted" aria-live="polite">Сул цаг хайж байна…</p>
      ) : slots.length === 0 ? (
        <p className="rounded-xl bg-ground p-3 text-sm text-muted" aria-live="polite">Энэ өдөр сул цаг алга.</p>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(80px,1fr))] gap-2">
          {slots.map((s) => (
            <button key={s.startMin} onClick={() => setStartMin(s.startMin)} aria-pressed={s.startMin === startMin}
              className={`min-h-12 rounded-xl border-[1.5px] text-[15px] font-bold ${s.startMin === startMin ? "border-brand bg-brand" : "border-line bg-white"}`}>
              {s.label}
            </button>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <button disabled={startMin == null || p.busy} onClick={() => startMin != null && p.onPick(date, startMin)} className={`${btnPrimary} flex-1`}>
          {p.busy ? "Түр хүлээнэ үү…" : "Энэ цаг руу шилжүүлэх"}
        </button>
        <button disabled={p.busy} onClick={p.onCancel} className={btnSecondary}>Болих</button>
      </div>
    </div>
  );
}
