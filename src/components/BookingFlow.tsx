"use client";
/**
 * Захиалгын урсгал: 1. Үйлчилгээ → 2. Ажилтан ба цаг → 3. Баталгаажуулах
 * Утсанд нэг багана, компьютерт гурван багана (flex-wrap). Загвар: canvas-ын Main.dc.html
 */
import { useEffect, useMemo, useState, useTransition } from "react";
import { createBooking, type BookingResult } from "@/server/bookings";
import { ExpiredNotice, PhoneVerifyPanel, usePhoneVerification } from "./PhoneVerify";

export type BookingFlowProps = {
  slug: string;
  bookingMode: "staff" | "resource";
  staffTerm: string;
  customFields: { key: string; label: string; required: boolean }[];
  services: { id: string; name: string; duration: string; price: string | null }[];
  staffByService: Record<string, { id: string; name: string; title: string | null }[]>;
  days: { date: string; wd: string; num: string; sub: string }[];
};

type SlotDto = { label: string; startMin: number };

const chip = (on: boolean) =>
  on ? "border-brand bg-brand text-ink" : "border-line bg-white text-ink hover:border-ink/30";
const card = (on: boolean) => (on ? "border-brand bg-brand-tint" : "border-line bg-white hover:border-ink/30");

export function BookingFlow(p: BookingFlowProps) {
  const [serviceId, setServiceId] = useState(p.services[0]?.id ?? "");
  const [staffId, setStaffId] = useState<string | null>(null);
  const [date, setDate] = useState(p.days[0]?.date ?? "");
  const [slots, setSlots] = useState<SlotDto[] | null>(null);
  const [startMin, setStartMin] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<BookingResult | null>(null);
  const [pending, startTransition] = useTransition();

  const service = p.services.find((s) => s.id === serviceId);
  const staffList = p.bookingMode === "staff" ? (p.staffByService[serviceId] ?? []) : [];
  const staffName = staffId ? staffList.find((s) => s.id === staffId)?.name : "Хэн ч болно";
  const day = p.days.find((d) => d.date === date);

  // Сонголт өөрчлөгдөхөд сул цагийг дахин татна
  useEffect(() => {
    if (!serviceId || !date) return;
    const ctrl = new AbortController();
    setSlots(null);
    setStartMin(null);
    const qs = new URLSearchParams({ serviceId, date, ...(staffId ? { staffId } : {}) });
    fetch(`/api/${p.slug}/slots?${qs}`, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : { slots: [] }))
      .then((d: { slots: SlotDto[] }) => setSlots(d.slots))
      .catch(() => {});
    return () => ctrl.abort();
  }, [p.slug, serviceId, staffId, date]);

  const groups = useMemo(() => {
    const s = slots ?? [];
    return [
      { label: "Өглөө", items: s.filter((x) => x.startMin < 720) },
      { label: "Өдөр", items: s.filter((x) => x.startMin >= 720 && x.startMin < 1020) },
      { label: "Орой", items: s.filter((x) => x.startMin >= 1020) },
    ].filter((g) => g.items.length);
  }, [slots]);

  const selectedLabel = slots?.find((s) => s.startMin === startMin)?.label;

  function book(verifyToken: string) {
    if (startMin == null) return;
    startTransition(async () => {
      const r = await createBooking({ slug: p.slug, serviceId, staffId, date, startMin, name, phone, answers, verifyToken });
      setResult(r);
      if (!r.ok && r.reason === "unverified") pv.reset();
      if (!r.ok && r.reason === "slot_taken") {
        // Сул цагийг дахин ачаална
        setDate((d) => d);
        setStartMin(null);
        setSlots((s) => s?.filter((x) => x.startMin !== startMin) ?? null);
      }
    });
  }

  // Баталгаажмагц автоматаар захиална
  const pv = usePhoneVerification((token) => book(token));
  const verification = pv.verification;

  function submit() {
    if (startMin == null) return;
    if (verification?.state === "verified" && verification.phone === phone) {
      book(verification.token);
      return;
    }
    setResult(null);
    void pv.start(phone);
  }

  function changePhone(v: string) {
    setPhone(v);
    if (verification && verification.phone !== v) pv.reset();
  }

  if (result?.ok) {
    return (
      <section className="mx-auto flex w-full max-w-md flex-col items-center gap-3 rounded-[18px] border border-line bg-white p-8 text-center">
        <div aria-hidden className="flex size-16 items-center justify-center rounded-full bg-ink">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#f5a800" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
        </div>
        <h2 className="text-xl font-extrabold">{result.status === "confirmed" ? "Таны цаг баталгаажлаа" : "Захиалга хүлээн авлаа"}</h2>
        <p className="text-sm text-muted">{service?.name} · {p.bookingMode === "staff" ? staffName : ""}</p>
        <p className="text-2xl font-extrabold">{result.day}, {result.time}</p>
        <p className="text-[13px] text-muted">
          {result.status === "confirmed" ? "Дэлгэрэнгүйг SMS-ээр илгээлээ. 24 цагийн өмнө сануулна." : "Ажилтан батлахад SMS ирнэ."}
        </p>
        <button onClick={() => { setResult(null); setStartMin(null); }} className="mt-2 min-h-12 rounded-xl border border-line px-5 text-sm font-bold">
          Өөр цаг захиалах
        </button>
      </section>
    );
  }

  return (
    <div className="flex flex-wrap items-start gap-6">
      {/* 1. Үйлчилгээ */}
      <section aria-labelledby="h-svc" className="flex min-w-0 flex-[1_1_300px] flex-col gap-3">
        <h2 id="h-svc" className="text-lg font-extrabold">1. Үйлчилгээ</h2>
        {p.services.map((s) => (
          <button
            key={s.id}
            onClick={() => { setServiceId(s.id); setStaffId(null); }}
            aria-pressed={s.id === serviceId}
            className={`flex w-full items-center gap-3.5 rounded-card border-[1.5px] p-4 text-left ${card(s.id === serviceId)}`}
          >
            <span className="flex flex-1 flex-col"><span className="text-[15px] font-bold">{s.name}</span><span className="text-[13px] text-muted">{s.duration}</span></span>
            {s.price && <span className="text-[15px] font-bold whitespace-nowrap">{s.price}</span>}
          </button>
        ))}
        <p className="text-[13px] text-muted">Үнэ мэдээллийн зорилготой — тооцоог газар дээр нь хийнэ.</p>
      </section>

      {/* 2. Ажилтан ба цаг */}
      <section aria-labelledby="h-time" className="flex min-w-0 flex-[2_1_440px] flex-col gap-5 rounded-[18px] border border-line bg-white p-5">
        <h2 id="h-time" className="text-lg font-extrabold">2. {p.bookingMode === "staff" ? `${p.staffTerm} ба цаг` : "Цаг"}</h2>

        {p.bookingMode === "staff" && staffList.length > 1 && (
          <div className="flex flex-col gap-2.5">
            <div className="text-[13px] font-bold text-muted">{p.staffTerm}</div>
            <div className="flex flex-wrap gap-2">
              {[{ id: null as string | null, name: "Хэн ч болно", title: "Хамгийн эрт сул" }, ...staffList].map((s) => (
                <button key={s.id ?? "any"} onClick={() => setStaffId(s.id)} aria-pressed={s.id === staffId}
                  className={`min-h-12 rounded-full border-[1.5px] px-4 text-left text-sm font-bold ${card(s.id === staffId)}`}>
                  {s.name}{s.title && <span className="block text-xs font-medium text-muted">{s.title}</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2.5">
          <div className="text-[13px] font-bold text-muted">Өдөр</div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {p.days.map((d) => (
              <button key={d.date} onClick={() => setDate(d.date)} aria-pressed={d.date === date} aria-label={d.date}
                className={`flex min-h-[72px] w-16 flex-none flex-col items-center justify-center rounded-card border-[1.5px] ${chip(d.date === date)}`}>
                <span className="text-xs font-bold">{d.wd}</span>
                <span className="text-xl font-extrabold">{d.num}</span>
                <span className="text-[11px] font-semibold">{d.sub}</span>
              </button>
            ))}
          </div>
        </div>

        {slots === null ? (
          <p className="text-sm text-muted" aria-live="polite">Сул цаг хайж байна…</p>
        ) : groups.length === 0 ? (
          <p className="rounded-xl bg-ground p-4 text-sm text-muted" aria-live="polite">Энэ өдөр сул цаг алга. Өөр өдөр сонгоно уу.</p>
        ) : (
          groups.map((g) => (
            <div key={g.label} className="flex flex-col gap-2.5">
              <div className="text-[13px] font-bold text-muted">{g.label}</div>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(88px,1fr))] gap-2">
                {g.items.map((t) => (
                  <button key={t.startMin} onClick={() => setStartMin(t.startMin)} aria-pressed={t.startMin === startMin}
                    className={`min-h-12 rounded-xl border-[1.5px] text-[15px] font-bold ${chip(t.startMin === startMin)}`}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </section>

      {/* 3. Баталгаажуулах */}
      <aside aria-labelledby="h-sum" className="flex min-w-0 flex-[1_1_280px] flex-col gap-4 rounded-[18px] border border-line bg-white p-5">
        <h2 id="h-sum" className="text-lg font-extrabold">3. Баталгаажуулах</h2>
        <dl className="flex flex-col gap-2.5 rounded-xl bg-ground p-3.5 text-sm">
          <Row k="Үйлчилгээ" v={service ? `${service.name} (${service.duration})` : "—"} />
          {p.bookingMode === "staff" && <Row k={p.staffTerm} v={staffName ?? "—"} />}
          <Row k="Өдөр" v={day ? `${day.wd}, ${day.date.slice(5).replace("-", "/")}` : "—"} />
          <Row k="Цаг" v={selectedLabel ?? "Сонгоогүй"} />
        </dl>
        <Field id="nm" label="Нэр" value={name} onChange={setName} placeholder="Таны нэр" />
        <Field id="ph" label="Утасны дугаар" value={phone} onChange={changePhone} placeholder="9911 2233" type="tel" hint="Дугаараа нэг SMS илгээж баталгаажуулна." />
        {p.customFields.map((f) => (
          <Field key={f.key} id={`cf-${f.key}`} label={f.label} value={answers[f.key] ?? ""} onChange={(v) => setAnswers((a) => ({ ...a, [f.key]: v }))} />
        ))}
        {result && !result.ok && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-800">{result.message}</p>}

        {pv.error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-800">{pv.error}</p>}
        {verification?.state === "pending" ? (
          <PhoneVerifyPanel v={verification} onCancel={pv.reset} />
        ) : (
          <>
            {verification?.state === "expired" && <ExpiredNotice />}
            <button onClick={submit} disabled={startMin == null || pending || pv.starting || !name || !phone}
              className="min-h-13 rounded-card bg-brand py-3.5 text-base font-extrabold text-ink disabled:cursor-not-allowed disabled:opacity-50">
              {pending || pv.starting ? "Түр хүлээнэ үү…" : "Цаг захиалах"}
            </button>
          </>
        )}
        <p className="text-center text-xs text-muted">Захиалгын төлбөр байхгүй · SMS-ийн холбоосоор шилжүүлж, цуцалж болно</p>
      </aside>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3"><dt className="text-[13px] text-muted">{k}</dt><dd className="text-right font-bold">{v}</dd></div>
  );
}

function Field(p: { id: string; label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; hint?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={p.id} className="text-[13px] font-bold">{p.label}</label>
      <input id={p.id} type={p.type ?? "text"} value={p.value} onChange={(e) => p.onChange(e.target.value)} placeholder={p.placeholder}
        inputMode={p.type === "tel" ? "numeric" : undefined}
        className="min-h-12 rounded-xl border-[1.5px] border-[#d6d3cc] bg-white px-3.5 text-[15px] outline-none focus:border-ink" />
      {p.hint && <span className="text-xs text-muted">{p.hint}</span>}
    </div>
  );
}
