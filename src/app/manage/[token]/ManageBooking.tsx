"use client";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { ErrorBox, btnDanger, btnPrimary, btnSecondary } from "@/components/ui";
import type { DayChip } from "@/lib/booking-ui";
import type { ChangeBlock } from "@/lib/policy";
import { cancelByCustomer, manageSlots, rescheduleByCustomer } from "@/server/manage-actions";

const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

export function ManageBooking(p: {
  token: string;
  active: boolean;
  block: ChangeBlock;
  cancellationHours: number;
  tenantPhone: string | null;
  slug: string;
  days: DayChip[];
  currentDate: string;
  /** "Үсчин батлахад SMS ирнэ." */
  approvalText: string;
}) {
  const [mode, setMode] = useState<"view" | "move" | "confirmCancel">("view");
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const cancel = () =>
    start(async () => {
      setError(null);
      try {
        const r = await cancelByCustomer(p.token);
        if (r.ok) { setDone("Захиалга цуцлагдлаа. Байгууллагад мэдэгдлээ."); setMode("view"); }
        else setError(r.message);
      } catch {
        setError("Сүлжээний алдаа. Дахин оролдоно уу.");
      }
    });

  const move = (date: string, startMin: number) =>
    start(async () => {
      setError(null);
      try {
        const r = await rescheduleByCustomer({ token: p.token, date, startMin });
        if (r.ok) {
          // Гараар батлах байгууллагад шилжүүлсэн цаг дахин батлах хүлээгдэнэ — үүнийг тод хэлнэ
          setDone(r.status === "pending"
            ? `Шинэ цаг: ${r.day}, ${r.time}. Энэ цаг батлах хүлээгдэж байна — ${p.approvalText}`
            : `Цаг шилжлээ: ${r.day}, ${r.time}. Баталгаажсан.`);
          setMode("view");
        } else setError(r.message);
      } catch {
        setError("Сүлжээний алдаа. Дахин оролдоно уу.");
      }
    });

  const doneBox = done && (
    <p role="status" className="rounded-xl bg-green-50 p-3 text-sm font-semibold text-green-800">✓ {done}</p>
  );

  if (!p.active) {
    return (
      <div className="flex flex-col gap-3">
        {doneBox}
        <Link href={`/${p.slug}`} className={btnPrimary}>Шинээр цаг захиалах</Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {doneBox}
      {error && <ErrorBox>{error}</ErrorBox>}

      <a href={`/manage/${p.token}/ics`} className={btnSecondary}>📅 Календарьт нэмэх</a>

      {p.block === "too_late" ? (
        <p className="rounded-xl bg-ground p-4 text-sm">
          Эхлэхэд {p.cancellationHours} цагаас бага хугацаа үлдсэн тул өөрчлөхийн тулд байгууллага руу залгана уу.
          {p.tenantPhone && <> <a href={`tel:${p.tenantPhone}`} className="font-medium underline">{p.tenantPhone}</a></>}
        </p>
      ) : mode === "move" ? (
        <MovePicker token={p.token} days={p.days} initialDate={p.currentDate} busy={pending}
          onCancel={() => setMode("view")} onPick={move} />
      ) : mode === "confirmCancel" ? (
        <div className="flex flex-col gap-3 rounded-xl border border-red-200 bg-white p-4">
          <p className="font-medium">Захиалгаа цуцлах уу?</p>
          <div className="flex gap-2">
            <button type="button" disabled={pending} onClick={cancel} className={`${btnDanger} ${focusRing} flex-1`}>
              {pending ? "Түр хүлээнэ үү…" : "Тийм, цуцлах"}
            </button>
            <button type="button" disabled={pending} onClick={() => setMode("view")} className={`${btnSecondary} ${focusRing} flex-1`}>Үгүй</button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <button type="button" onClick={() => { setDone(null); setMode("move"); }} className={`${btnSecondary} ${focusRing} flex-1`}>Өөр цаг сонгох</button>
          <button type="button" onClick={() => { setDone(null); setMode("confirmCancel"); }} className={`${btnDanger} ${focusRing} flex-1`}>Цуцлах</button>
        </div>
      )}
    </div>
  );
}

function MovePicker(p: {
  token: string;
  days: DayChip[];
  initialDate: string;
  busy: boolean;
  onCancel: () => void;
  onPick: (date: string, startMin: number) => void;
}) {
  const [date, setDate] = useState(p.days.some((d) => d.date === p.initialDate) ? p.initialDate : (p.days[0]?.date ?? ""));
  const [slots, setSlots] = useState<{ label: string; startMin: number }[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [startMin, setStartMin] = useState<number | null>(null);

  useEffect(() => {
    let live = true;
    setSlots(null);
    setLoadError(null);
    setStartMin(null);
    manageSlots({ token: p.token, date })
      .then((r) => {
        if (!live) return;
        if (r.ok) setSlots(r.slots);
        else setLoadError(r.message);
      })
      .catch(() => live && setLoadError("Сул цагийг ачаалж чадсангүй. Интернэт холболтоо шалгаад дахин оролдоно уу."));
    return () => { live = false; };
  }, [p.token, date, reloadKey]);

  return (
    <div className="flex flex-col gap-3 rounded-[18px] border border-line bg-white p-4">
      <h2 className="font-semibold">Шинэ цаг</h2>
      <div className="flex gap-2 overflow-x-auto p-1">
        {p.days.map((d) => (
          <button type="button" key={d.date} onClick={() => setDate(d.date)} aria-pressed={d.date === date} aria-label={d.label}
            className={`flex min-h-[64px] w-14 flex-none flex-col items-center justify-center rounded-card border-[1.5px] ${focusRing} ${d.date === date ? "border-ink bg-brand text-ink" : "border-line bg-white"}`}>
            <span className="text-xs font-medium">{d.wd}</span>
            <span className="text-lg font-semibold">{d.num}</span>
            <span className="text-[10px] font-semibold">{d.sub}</span>
          </button>
        ))}
      </div>
      {loadError ? (
        <div role="alert" className="flex flex-col items-start gap-3 rounded-xl bg-red-50 p-3 text-sm text-red-800">
          <p className="font-semibold">{loadError}</p>
          <button type="button" onClick={() => setReloadKey((k) => k + 1)} className={`min-h-11 rounded-xl border-[1.5px] border-ink bg-white px-4 font-medium text-ink ${focusRing}`}>
            Дахин оролдох
          </button>
        </div>
      ) : slots === null ? (
        <p className="text-sm text-muted" aria-live="polite">Сул цаг хайж байна…</p>
      ) : slots.length === 0 ? (
        <p className="rounded-xl bg-ground p-3 text-sm text-muted" aria-live="polite">Энэ өдөр сул цаг алга. Өөр өдөр сонгоно уу.</p>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(80px,1fr))] gap-2">
          {slots.map((s) => (
            <button type="button" key={s.startMin} onClick={() => setStartMin(s.startMin)} aria-pressed={s.startMin === startMin}
              className={`min-h-12 rounded-xl border-[1.5px] text-sm font-semibold ${focusRing} ${s.startMin === startMin ? "border-ink bg-brand text-ink" : "border-line bg-white"}`}>
              {s.label}
            </button>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <button type="button" disabled={startMin == null || p.busy} onClick={() => startMin != null && p.onPick(date, startMin)} className={`${btnPrimary} ${focusRing} flex-1`}>
          {p.busy ? "Түр хүлээнэ үү…" : "Энэ цаг руу шилжүүлэх"}
        </button>
        <button type="button" disabled={p.busy} onClick={p.onCancel} className={`${btnSecondary} ${focusRing}`}>Болих</button>
      </div>
    </div>
  );
}
