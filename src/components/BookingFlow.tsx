"use client";
/**
 * Захиалгын урсгал: 1. Үйлчилгээ → 2. Ажилтан ба цаг → 3. Таны мэдээлэл (+ утас баталгаажуулах)
 * Утсанд нэг багана, компьютерт гурван багана (flex-wrap). Загвар: canvas-ын Main.dc.html
 */
import { Field, Row, SuccessMark } from "./ui";
import { formatBookingCode } from "@/lib/booking-code";
import { approvalWaitText, joinParts, type DayChip } from "@/lib/booking-ui";
import { formatDayMn } from "@/lib/time";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { createBooking, precheckBooking, type BookingResult } from "@/server/bookings";
import { ExpiredNotice, PhoneVerifyPanel, usePhoneVerification } from "./PhoneVerify";

export type BookingFlowProps = {
  slug: string;
  bookingMode: "staff" | "resource";
  staffTerm: string;
  customFields: { key: string; label: string; required: boolean }[];
  services: { id: string; name: string; duration: string; price: string | null }[];
  staffByService: Record<string, { id: string; name: string; title: string | null }[]>;
  days: DayChip[];
  /** Цуцлах бодлого нэг мөрөөр (cancelPolicyText) */
  cancelPolicy: string;
};

const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

type SlotDto = { label: string; startMin: number };

const chip = (on: boolean) =>
  on ? "border-ink bg-brand text-ink" : "border-line bg-white text-ink hover:border-ink/30";
const card = (on: boolean) => (on ? "border-ink bg-brand-tint" : "border-line bg-white hover:border-ink/30");

export function BookingFlow(p: BookingFlowProps) {
  const [serviceId, setServiceId] = useState(p.services[0]?.id ?? "");
  const [staffId, setStaffId] = useState<string | null>(null);
  const [date, setDate] = useState(p.days[0]?.date ?? "");
  const [slots, setSlots] = useState<SlotDto[] | null>(null);
  const [slotsError, setSlotsError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [checking, setChecking] = useState(false);
  const [startMin, setStartMin] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<BookingResult | null>(null);
  const [pending, startTransition] = useTransition();
  const doneRef = useRef<HTMLHeadingElement>(null);

  const service = p.services.find((s) => s.id === serviceId);
  const staffList = p.bookingMode === "staff" ? (p.staffByService[serviceId] ?? []) : [];
  const staffName = staffId ? staffList.find((s) => s.id === staffId)?.name : "Хэн ч болно";
  const day = p.days.find((d) => d.date === date);

  // Сонголт өөрчлөгдөхөд сул цагийг дахин татна
  useEffect(() => {
    if (!serviceId || !date) return;
    const ctrl = new AbortController();
    let cleanedUp = false;
    setSlots(null);
    setSlotsError(false);
    setStartMin(null);
    const qs = new URLSearchParams({ serviceId, date, ...(staffId ? { staffId } : {}) });
    // Сүлжээ сул үед мөнхийн "хайж байна…" болохоос сэргийлж 10 сек-ийн хязгаар
    const timer = setTimeout(() => ctrl.abort(), 10_000);
    fetch(`/api/${p.slug}/slots?${qs}`, { signal: ctrl.signal })
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json() as Promise<{ slots: SlotDto[] }>;
      })
      .then((d) => setSlots(d.slots))
      .catch(() => {
        // Цэвэрлэх үеийн abort биш, жинхэнэ алдаа/timeout бол алдааны төлөв
        if (!cleanedUp) setSlotsError(true);
      })
      .finally(() => clearTimeout(timer));
    return () => { cleanedUp = true; clearTimeout(timer); ctrl.abort(); };
  }, [p.slug, serviceId, staffId, date, reloadKey]);

  const groups = useMemo(() => {
    const s = slots ?? [];
    return [
      { label: "Өглөө", items: s.filter((x) => x.startMin < 720) },
      { label: "Өдөр", items: s.filter((x) => x.startMin >= 720 && x.startMin < 1020) },
      { label: "Орой", items: s.filter((x) => x.startMin >= 1020) },
    ].filter((g) => g.items.length);
  }, [slots]);

  const selectedLabel = slots?.find((s) => s.startMin === startMin)?.label;

  // Амжилтын дэлгэц гарахад focus-ийг гарчиг руу шилжүүлнэ (дэлгэц уншигч, гарын хэрэглэгчид)
  const succeeded = !!result?.ok;
  useEffect(() => {
    if (!succeeded) return;
    window.scrollTo({ top: 0, behavior: "smooth" });
    doneRef.current?.focus();
  }, [succeeded]);

  function book(verifyToken: string) {
    if (startMin == null) return;
    startTransition(async () => {
      const r = await createBooking({ slug: p.slug, serviceId, staffId, date, startMin, name, phone, answers, verifyToken });
      setResult(r);
      if (!r.ok && r.reason === "unverified") pv.reset();
      if (!r.ok && r.reason === "slot_taken") {
        // Сул цагийг серверээс шинээр татна
        setReloadKey((k) => k + 1);
        document.getElementById("h-time")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }

  // Баталгаажмагц автоматаар захиална
  const pv = usePhoneVerification((token) => book(token));
  const verification = pv.verification;

  const missingRequired = p.customFields.some((f) => f.required && !answers[f.key]?.trim());

  async function submit() {
    if (startMin == null || pending || checking || pv.starting) return;
    // SMS хүлээж байхад Enter дарвал шинэ код эхлүүлэхгүй
    if (verification?.state === "pending") return;
    if (verification?.state === "verified" && verification.phone === phone) {
      book(verification.token);
      return;
    }
    setResult(null);
    // SMS (төлбөртэй) илгээлгэхээс өмнө бусад бүх зүйл зөв эсэхийг шалгана
    setChecking(true);
    try {
      const c = await precheckBooking({ slug: p.slug, serviceId, staffId, date, startMin, name, phone, answers });
      if (!c.ok) {
        setResult(c);
        if (c.reason === "slot_taken") {
          setReloadKey((k) => k + 1);
          document.getElementById("h-time")?.scrollIntoView({ behavior: "smooth", block: "start" });
        }
        return;
      }
    } catch {
      setResult({ ok: false, reason: "error", message: "Сүлжээний алдаа. Дахин оролдоно уу." });
      return;
    } finally {
      setChecking(false);
    }
    void pv.start(phone);
  }

  function changePhone(v: string) {
    setPhone(v);
    if (verification && verification.phone !== v) pv.reset();
  }

  if (result?.ok) {
    return (
      <section className="mx-auto flex w-full max-w-md flex-col items-center gap-3 rounded-[18px] border border-line bg-white p-8 text-center">
        <SuccessMark />
        <h2 ref={doneRef} tabIndex={-1} className="text-xl font-bold outline-none">
          {result.status === "confirmed" ? "Таны цаг баталгаажлаа" : "Захиалга хүлээн авлаа"}
        </h2>
        <p className="text-sm text-muted">{joinParts([result.serviceName, result.ownerName])}</p>
        <p className="text-2xl font-bold">{result.day}, {result.time}</p>
        <div className="w-full rounded-xl bg-ground px-4 py-3">
          <div className="text-xs text-muted">Захиалгын код — хадгалаарай</div>
          <div className="font-mono text-2xl font-bold tracking-[0.15em]">{formatBookingCode(result.code)}</div>
        </div>
        <p className="text-xs text-muted">
          {result.status === "confirmed" ? "Дэлгэрэнгүйг SMS-ээр илгээлээ. 24 цагийн өмнө сануулна." : approvalWaitText(p.bookingMode, p.staffTerm)}
        </p>
        <div className="mt-2 flex w-full flex-col gap-2">
          <a href={`${result.managePath}/ics`} className={`flex min-h-12 items-center justify-center rounded-card bg-brand font-semibold text-ink ${focusRing}`}>
            📅 Календарьт нэмэх
          </a>
          <a href={result.managePath} className={`flex min-h-12 items-center justify-center rounded-xl border border-line text-sm font-medium ${focusRing}`}>
            Захиалгаа харах · шилжүүлэх · цуцлах
          </a>
        </div>
        <p className="text-xs text-muted">{p.cancelPolicy}</p>
        <button type="button" onClick={() => { setResult(null); setStartMin(null); pv.reset(); }} className={`min-h-12 rounded-xl px-5 text-sm font-medium text-brand-deep underline ${focusRing}`}>
          Өөр цаг захиалах
        </button>
      </section>
    );
  }

  return (
    <div className="flex flex-wrap items-start gap-6">
      {/* 1. Үйлчилгээ */}
      <section aria-labelledby="h-svc" className="flex min-w-0 flex-[1_1_300px] flex-col gap-3">
        <h2 id="h-svc" className="text-lg font-semibold">1. Үйлчилгээ</h2>
        {p.services.map((s) => (
          <button
            type="button"
            key={s.id}
            onClick={() => { setServiceId(s.id); setStaffId(null); }}
            aria-pressed={s.id === serviceId}
            className={`flex w-full items-center gap-3.5 rounded-card border-[1.5px] p-4 text-left ${focusRing} ${card(s.id === serviceId)}`}
          >
            <span className="flex flex-1 flex-col"><span className="text-sm font-medium">{s.name}</span><span className="text-xs text-muted">{s.duration}</span></span>
            {s.price && <span className="text-sm font-medium whitespace-nowrap">{s.price}</span>}
          </button>
        ))}
        <p className="text-xs text-muted">Үнэ мэдээллийн зорилготой — тооцоог газар дээр нь хийнэ.</p>
      </section>

      {/* 2. Ажилтан ба цаг */}
      <section aria-labelledby="h-time" className="flex min-w-0 flex-[2_1_440px] flex-col gap-5 rounded-[18px] border border-line bg-white p-5">
        <h2 id="h-time" className="text-lg font-semibold">2. {p.bookingMode === "staff" ? `${p.staffTerm} ба цаг` : "Цаг"}</h2>

        {p.bookingMode === "staff" && staffList.length > 1 && (
          <div className="flex flex-col gap-2.5">
            <div className="text-xs font-medium text-muted">{p.staffTerm}</div>
            <div className="flex flex-wrap gap-2">
              {[{ id: null as string | null, name: "Хэн ч болно", title: "Хамгийн эрт сул" }, ...staffList].map((s) => (
                <button type="button" key={s.id ?? "any"} onClick={() => setStaffId(s.id)} aria-pressed={s.id === staffId}
                  className={`min-h-12 rounded-full border-[1.5px] px-4 text-left text-sm font-medium ${focusRing} ${card(s.id === staffId)}`}>
                  {s.name}{s.title && <span className="block text-xs font-medium text-muted">{s.title}</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2.5">
          <div className="text-xs font-medium text-muted">Өдөр</div>
          <div className="flex gap-2 overflow-x-auto p-1">
            {p.days.map((d) => (
              <button type="button" key={d.date} onClick={() => setDate(d.date)} aria-pressed={d.date === date} aria-label={d.label}
                className={`flex min-h-[72px] w-16 flex-none flex-col items-center justify-center rounded-card border-[1.5px] ${focusRing} ${chip(d.date === date)}`}>
                <span className="text-xs font-medium">{d.wd}</span>
                <span className="text-xl font-semibold">{d.num}</span>
                <span className="text-[11px] font-semibold">{d.sub}</span>
              </button>
            ))}
          </div>
        </div>

        {slotsError ? (
          <div role="alert" className="flex flex-col items-start gap-3 rounded-xl bg-ground p-4 text-sm">
            <p>Сул цагийг ачаалж чадсангүй. Интернэт холболтоо шалгаад дахин оролдоно уу.</p>
            <button type="button" onClick={() => setReloadKey((k) => k + 1)} className={`min-h-11 rounded-xl border-[1.5px] border-ink px-4 font-medium ${focusRing}`}>
              Дахин оролдох
            </button>
          </div>
        ) : slots === null ? (
          <p className="text-sm text-muted" aria-live="polite">Сул цаг хайж байна…</p>
        ) : groups.length === 0 ? (
          <p className="rounded-xl bg-ground p-4 text-sm text-muted" aria-live="polite">Энэ өдөр сул цаг алга. Өөр өдөр сонгоно уу.</p>
        ) : (
          groups.map((g) => (
            <div key={g.label} className="flex flex-col gap-2.5">
              <div className="text-xs font-medium text-muted">{g.label}</div>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(88px,1fr))] gap-2">
                {g.items.map((t) => (
                  <button type="button" key={t.startMin} onClick={() => setStartMin(t.startMin)} aria-pressed={t.startMin === startMin}
                    className={`min-h-12 rounded-xl border-[1.5px] text-sm font-medium ${focusRing} ${chip(t.startMin === startMin)}`}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </section>

      {/* 3. Таны мэдээлэл — нэр, утас (+ нэмэлт талбар), дараа нь утсаа SMS-ээр баталгаажуулна */}
      <aside aria-labelledby="h-sum" className="flex min-w-0 flex-[1_1_280px] flex-col gap-4 rounded-[18px] border border-line bg-white p-5">
        <h2 id="h-sum" className="text-lg font-semibold">3. Таны мэдээлэл</h2>
        <dl className="flex flex-col gap-2.5 rounded-xl bg-ground p-3.5 text-sm">
          <Row k="Үйлчилгээ" v={service ? `${service.name} (${service.duration})` : "—"} />
          {p.bookingMode === "staff" && <Row k={p.staffTerm} v={staffName ?? "—"} />}
          <Row k="Өдөр" v={day ? formatDayMn(day.date) : "—"} />
          <Row k="Цаг" v={selectedLabel ?? "Сонгоогүй"} />
        </dl>
        <form
          className="flex flex-col gap-4"
          aria-label="Таны мэдээлэл"
          onSubmit={(e) => { e.preventDefault(); void submit(); }}
        >
          <Field id="nm" name="name" label="Нэр" value={name} onChange={setName} placeholder="Таны нэр" autoComplete="name" />
          <Field id="ph" name="tel" label="Утасны дугаар" value={phone} onChange={changePhone} placeholder="9911 2233" type="tel" autoComplete="tel"
            hint={verification?.state === "pending" ? undefined : "Захиалгаа батлахын тулд та энэ дугаараас 144773 руу 1 SMS илгээнэ. SMS-ийн үнэ таны данснаас гарна."} />
          {p.customFields.map((f) => (
            <Field key={f.key} id={`cf-${f.key}`} name={`cf-${f.key}`} label={f.required ? `${f.label} (заавал)` : f.label} value={answers[f.key] ?? ""} onChange={(v) => setAnswers((a) => ({ ...a, [f.key]: v }))} />
          ))}
          {result && !result.ok && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-800">{result.message}</p>}

          {pv.error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-800">{pv.error}</p>}
          {verification?.state === "pending" ? (
            <PhoneVerifyPanel v={verification} onCancel={pv.reset} netError={pv.netError} onCheck={() => void pv.checkNow()} />
          ) : (
            <>
              {verification?.state === "expired" && <ExpiredNotice onRestart={pv.restart} busy={pv.starting} />}
              <button type="submit" disabled={startMin == null || pending || checking || pv.starting || !name || !phone || missingRequired}
                className={`min-h-13 rounded-card bg-brand py-3.5 text-[15px] font-semibold text-ink disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`}>
                {pending || checking || pv.starting ? "Түр хүлээнэ үү…" : "Цаг захиалах"}
              </button>
            </>
          )}
        </form>
        <p className="text-center text-xs text-muted">Захиалгын төлбөр байхгүй. {p.cancelPolicy}</p>
      </aside>
    </div>
  );
}
