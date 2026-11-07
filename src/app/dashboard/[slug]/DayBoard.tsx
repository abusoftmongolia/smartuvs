"use client";
/**
 * Өдрийн календарь: багана = ажилтан/бокс, мөр = цаг. Утсанд хэвтээ гүйлгэнэ.
 * Захиалга дээр дарахад дэлгэрэнгүй + үйлдлүүд (батлах, ирсэн, ирээгүй, шилжүүлэх, цуцлах).
 */
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { ErrorBox, Field, Row, btnDanger, btnPrimary, btnSecondary } from "@/components/ui";
import { addDays, formatHm } from "@/lib/time";
import {
  createManualBooking,
  rescheduleBooking,
  setBookingStatus,
  type ActionResult,
} from "@/server/dashboard-actions";
import type { DashSlot } from "@/server/slot-queries";
import { getJson, query } from "@/lib/fetch-json";
import { BOOKING_STATUS } from "@/lib/booking-status";

export type BoardBooking = {
  id: string;
  code: string;
  ownerId: string;
  date: string;
  dayLabel: string;
  startMin: number;
  endMin: number;
  timeLabel: string;
  status: "pending" | "confirmed" | "checked_in" | "completed" | "cancelled" | "no_show";
  source: "online" | "manual";
  serviceId: string;
  serviceName: string;
  customerName: string;
  customerPhone: string;
  noShowCount: number;
  answers: { label: string; value: string }[];
  notes: string | null;
};

type StatusAction = "confirm" | "decline" | "cancel" | "arrived" | "completed" | "no_show" | "undo";
type Owner = { id: string; name: string };
type Service = { id: string; name: string; durationMin: number };

type Props = {
  slug: string;
  date: string;
  today: string;
  dayLabel: string;
  ownerTerm: string;
  bookingMode: "staff" | "resource";
  owners: Owner[];
  workHours: { ownerId: string; start: number; end: number }[];
  fromMin: number;
  toMin: number;
  bookings: BoardBooking[];
  pending: BoardBooking[];
  services: Service[];
  /** Кодоор хайж олсон захиалга — анх нээгдсэн байдлаар харуулна */
  initialOpen?: BoardBooking | null;
  /** "calendar" = өдрийн календарь; "pending" = зөвхөн батлах хүлээж буй жагсаалт */
  view?: "calendar" | "pending";
};

const PX_PER_MIN = 1.4;

const STATUS = BOOKING_STATUS;


export function DayBoard(p: Props) {
  const router = useRouter();
  const [open, setOpen] = useState<BoardBooking | null>(p.initialOpen ?? null);
  const [creating, setCreating] = useState(false);
  const go = (date: string) => router.push(`/dashboard/${p.slug}/calendar?date=${date}`);

  // Өөр төхөөрөмжөөс орсон захиалгыг харуулахын тулд минут тутам шинэчилнэ
  // Таб нуугдсан эсвэл диалог нээлттэй үед шинэчлэхгүй (сул сүлжээнд дэмий RSC татахгүй, нээлттэй формыг алдахгүй)
  useEffect(() => {
    const t = setInterval(() => {
      if (document.visibilityState === "visible" && !open && !creating) router.refresh();
    }, 60_000);
    return () => clearInterval(t);
  }, [router, open, creating]);

  const hours: number[] = [];
  for (let m = p.fromMin; m < p.toMin; m += 60) hours.push(m);
  const height = (p.toMin - p.fromMin) * PX_PER_MIN;
  const counts = {
    total: p.bookings.length,
    pending: p.bookings.filter((b) => b.status === "pending").length,
  };

  return (
    <>
      {p.view === "pending" ? (
        p.pending.length === 0 ? (
          <p className="rounded-xl border border-line bg-white p-6 text-sm text-muted">Батлах хүлээж буй захиалга алга. ✓</p>
        ) : (
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3" aria-label="Батлах хүлээж буй">
            {p.pending.map((b) => (
              <li key={b.id}><PendingCard b={b} slug={p.slug} onOpen={() => setOpen(b)} /></li>
            ))}
          </ul>
        )
      ) : (<>
      {p.pending.length > 0 && (
        <Link href={`/dashboard/${p.slug}/pending`}
          className="flex min-h-12 items-center justify-between gap-3 rounded-xl border border-pending/30 bg-blue-50 px-4 text-sm font-medium text-blue-900">
          <span><b className="font-semibold">{p.pending.length}</b> захиалга батлах хүлээж байна</span>
          <span aria-hidden>→</span>
        </Link>
      )}

      <section aria-labelledby="h-day" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 id="h-day" className="mr-auto text-lg font-semibold">
            {p.dayLabel}{p.date === p.today ? " · Өнөөдөр" : ""}
            <span className="ml-2 text-sm font-semibold text-muted">{counts.total} захиалга</span>
          </h2>
          <button className={btnSecondary} onClick={() => go(addDays(p.date, -1))} aria-label="Өмнөх өдөр">‹</button>
          {p.date !== p.today && <button className={btnSecondary} onClick={() => go(p.today)}>Өнөөдөр</button>}
          <button className={btnSecondary} onClick={() => go(addDays(p.date, 1))} aria-label="Дараагийн өдөр">›</button>
          <DatePickButton date={p.date} onPick={go} />
          <button className={btnPrimary} onClick={() => setCreating(true)}>+ Захиалга</button>
        </div>

        {p.owners.length === 0 ? (
          <p className="rounded-card border border-line bg-white p-6 text-muted">
            {p.ownerTerm} бүртгэгдээгүй байна. <Link href={`/dashboard/${p.slug}/staff`} className="font-semibold text-brand-deep underline">Тохиргоо</Link>-оос нэмнэ үү.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-[18px] border border-line bg-white">
            <div className="flex min-w-max">
              {/* Цагийн багана */}
              <div className="sticky left-0 z-10 w-14 flex-none border-r border-line bg-white">
                <div className="h-11 border-b border-line" />
                <div className="relative" style={{ height }}>
                  {hours.map((m) => (
                    <div key={m} className="absolute right-2 -translate-y-1/2 text-xs font-semibold text-muted" style={{ top: (m - p.fromMin) * PX_PER_MIN }}>
                      {m > p.fromMin ? formatHm(m) : ""}
                    </div>
                  ))}
                </div>
              </div>
              {p.owners.map((o) => (
                <div key={o.id} className="w-44 flex-none border-r border-line last:border-r-0 sm:w-52">
                  <div className="flex h-11 items-center justify-center border-b border-line px-2 text-sm font-medium">{o.name}</div>
                  <div className="relative bg-ground" style={{ height }}>
                    {/* Ажлын цаг — цагаан */}
                    {p.workHours.filter((w) => w.ownerId === o.id).map((w, i) => (
                      <div key={i} className="absolute inset-x-0 bg-white" style={{ top: (w.start - p.fromMin) * PX_PER_MIN, height: (w.end - w.start) * PX_PER_MIN }} />
                    ))}
                    {hours.map((m) => (
                      <div key={m} className="absolute inset-x-0 border-t border-line/70" style={{ top: (m - p.fromMin) * PX_PER_MIN }} />
                    ))}
                    {p.bookings.filter((b) => b.ownerId === o.id).map((b) => (
                      <button
                        key={b.id}
                        onClick={() => setOpen(b)}
                        className={`absolute inset-x-1 overflow-hidden rounded-lg border-[1.5px] px-2 py-1 text-left text-xs ${STATUS[b.status].card}`}
                        style={{ top: (b.startMin - p.fromMin) * PX_PER_MIN + 1, height: Math.max(26, (b.endMin - b.startMin) * PX_PER_MIN - 2) }}
                        aria-label={`${b.timeLabel} ${b.customerName}, ${b.serviceName}, ${STATUS[b.status].label}`}
                      >
                        <span className="block font-medium">{formatHm(b.startMin)} {b.customerName}</span>
                        <span className="block truncate">{b.serviceName}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <ul className="flex flex-wrap gap-3 text-xs text-muted" aria-label="Тайлбар">
          {(["pending", "confirmed", "checked_in", "completed", "no_show"] as const).map((s) => (
            <li key={s} className="flex items-center gap-1.5"><span className={`size-3 rounded border-[1.5px] ${STATUS[s].card}`} />{STATUS[s].label}</li>
          ))}
        </ul>
      </section>
      </>)}

      {open && (
        <BookingDialog key={open.id} b={open} {...p} onClose={() => setOpen(null)} />
      )}
      {creating && <NewBookingDialog {...p} onClose={() => setCreating(false)} />}
    </>
  );
}

/**
 * Огноо сонгох: хөтчийн date input нь OS-ийн locale-аар (06/11/2026) харуулдаг тул
 * товч дээр Он.Сар.Өдөр (2026.11.06) бичиж, дарахад хөтчийн сонгогчийг нээнэ.
 */
function DatePickButton({ date, onPick }: { date: string; onPick: (d: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <span className="relative">
      <button type="button" className={`${btnSecondary} gap-2 tabular-nums`} aria-label={`Өдөр сонгох, одоо ${date.replaceAll("-", ".")}`}
        onClick={() => { const el = ref.current; if (!el) return; try { el.showPicker(); } catch { el.focus(); el.click(); } }}>
        <svg aria-hidden width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="16" rx="2.5" /><path d="M8 3v4M16 3v4M3 10h18" /></svg>
        {date.replaceAll("-", ".")}
      </button>
      <input ref={ref} type="date" value={date} tabIndex={-1} aria-hidden
        onChange={(e) => e.target.value && onPick(e.target.value)}
        className="pointer-events-none absolute inset-x-0 bottom-0 h-0 w-full opacity-0" />
    </span>
  );
}

// ── Батлах хүлээж буй карт ────────────────────────────────────────────────

function PendingCard({ b, slug, onOpen }: { b: BoardBooking; slug: string; onOpen: () => void }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const run = (action: "confirm" | "decline") =>
    start(async () => {
      const r = await setBookingStatus({ slug, bookingId: b.id, action });
      if (!r.ok) setError(r.message);
    });
  return (
    <div className="flex h-full flex-col gap-2 rounded-card border border-line p-3">
      <div className="text-sm font-medium">{b.dayLabel}, {b.timeLabel}</div>
      <div className="text-sm">{b.customerName} · <a className="underline" href={`tel:${b.customerPhone}`}>{b.customerPhone}</a></div>
      <div className="text-sm text-muted">{b.serviceName}</div>
      {b.noShowCount > 0 && <div className="text-xs font-medium text-red-800">Өмнө {b.noShowCount} удаа ирээгүй</div>}
      {error && <ErrorBox>{error}</ErrorBox>}
      <div className="mt-auto flex flex-wrap gap-2">
        <button disabled={pending} onClick={() => run("confirm")} className={`${btnPrimary} min-h-11 flex-1 text-sm`}>Батлах</button>
        <button disabled={pending} onClick={onOpen} className={btnSecondary}>Өөр цаг</button>
        <button disabled={pending} onClick={() => run("decline")} className={btnDanger}>Татгалзах</button>
      </div>
    </div>
  );
}

// ── Цонх (native <dialog>) ────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
    return () => d?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      aria-labelledby="modal-title"
      className="m-auto w-[min(100vw-24px,520px)] rounded-[18px] p-0 backdrop:bg-black/40"
    >
      <div className="flex max-h-[85dvh] flex-col gap-4 overflow-y-auto p-5">
        <div className="flex items-start justify-between gap-3">
          <h2 id="modal-title" className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="-m-2 inline-flex size-11 items-center justify-center rounded-xl text-xl" aria-label="Хаах">×</button>
        </div>
        {children}
      </div>
    </dialog>
  );
}

// ── Захиалгын дэлгэрэнгүй ─────────────────────────────────────────────────

function BookingDialog(p: Props & { b: BoardBooking; onClose: () => void }) {
  const { b } = p;
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [moving, setMoving] = useState(b.status === "pending");

  const run = (fn: () => Promise<ActionResult>) =>
    start(async () => {
      setError(null);
      const r = await fn();
      if (r.ok) p.onClose();
      else setError(r.message);
    });
  const status = (action: StatusAction) => run(() => setBookingStatus({ slug: p.slug, bookingId: b.id, action }));

  const ownerName = p.owners.find((o) => o.id === b.ownerId)?.name;
  const active = b.status === "pending" || b.status === "confirmed";

  return (
    <Modal title={`${b.customerName}`} onClose={p.onClose}>
      <dl className="flex flex-col gap-2 rounded-xl bg-ground p-3.5 text-sm">
        <Row k="Код" v={`#${b.code}`} />
        <Row k="Төлөв" v={STATUS[b.status].label} />
        <Row k="Цаг" v={`${b.dayLabel}, ${b.timeLabel}`} />
        <Row k="Үйлчилгээ" v={b.serviceName} />
        {ownerName && <Row k={p.ownerTerm} v={ownerName} />}
        <div className="flex justify-between gap-3">
          <dt className="text-xs text-muted">Утас</dt>
          <dd className="font-medium"><a className="underline" href={`tel:${b.customerPhone}`}>{b.customerPhone}</a></dd>
        </div>
        {b.answers.map((a) => <Row key={a.label} k={a.label} v={a.value} />)}
        {b.notes && <Row k="Тэмдэглэл" v={b.notes} />}
        <Row k="Эх сурвалж" v={b.source === "online" ? "Онлайн" : "Гараар"} />
        {b.noShowCount > 0 && <Row k="Ирээгүй түүх" v={`${b.noShowCount} удаа`} />}
      </dl>

      {error && <ErrorBox>{error}</ErrorBox>}

      <div className="flex flex-wrap gap-2">
        {b.status === "pending" && <button disabled={pending} onClick={() => status("confirm")} className={btnPrimary}>Батлах</button>}
        {(b.status === "confirmed" || b.status === "pending") && (
          <button disabled={pending} onClick={() => status("arrived")} className={btnSecondary}>Ирсэн</button>
        )}
        {b.status === "checked_in" && <button disabled={pending} onClick={() => status("completed")} className={btnSecondary}>Дууссан</button>}
        {(b.status === "confirmed" || b.status === "checked_in") && (
          <button disabled={pending} onClick={() => status("no_show")} className={btnSecondary}>Ирээгүй</button>
        )}
        {["checked_in", "completed", "no_show"].includes(b.status) && (
          <button disabled={pending} onClick={() => status("undo")} className={btnSecondary}>Буцаах</button>
        )}
        {active && !moving && <button disabled={pending} onClick={() => setMoving(true)} className={btnSecondary}>Өөр цаг санал болгох</button>}
        {b.status === "pending" && <button disabled={pending} onClick={() => status("decline")} className={btnDanger}>Татгалзах</button>}
        {b.status === "confirmed" && (
          <button disabled={pending} onClick={() => confirm("Захиалгыг цуцлах уу? Үйлчлүүлэгчид SMS очно.") && status("cancel")} className={btnDanger}>
            Цуцлах
          </button>
        )}
      </div>

      {active && moving && (
        <div className="flex flex-col gap-3 border-t border-line pt-4">
          <h3 className="font-semibold">Өөр цаг санал болгох</h3>
          <p className="text-xs text-muted">Шинэ цаг баталгаажиж, үйлчлүүлэгчид SMS очно. Тохирохгүй бол тэр холбоосоор цуцална.</p>
          <SlotPicker
            slug={p.slug}
            serviceId={b.serviceId}
            owners={p.owners}
            ownerTerm={p.ownerTerm}
            bookingMode={p.bookingMode}
            initialDate={b.date}
            initialOwner={b.ownerId || null}
            excludeBookingId={b.id}
            submitLabel="Шилжүүлэх"
            busy={pending}
            onPick={(s) => run(() => rescheduleBooking({ slug: p.slug, bookingId: b.id, ...s }))}
          />
        </div>
      )}
    </Modal>
  );
}

// ── Сул цаг сонгогч (шилжүүлэх, гараар нэмэх) ─────────────────────────────

type Pick = { date: string; startMin: number; ownerId: string | null };

function SlotPicker(p: {
  slug: string;
  serviceId: string;
  owners: Owner[];
  ownerTerm: string;
  bookingMode: "staff" | "resource";
  initialDate: string;
  initialOwner: string | null;
  excludeBookingId?: string;
  submitLabel: string;
  busy: boolean;
  disabled?: boolean;
  onPick: (s: Pick) => void;
}) {
  const [date, setDate] = useState(p.initialDate);
  const [ownerId, setOwnerId] = useState<string | null>(p.initialOwner);
  const [slots, setSlots] = useState<DashSlot[] | null>(null);
  const [slotsError, setSlotsError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [startMin, setStartMin] = useState<number | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    setSlots(null);
    setSlotsError(false);
    setStartMin(null);
    const qs = query({ serviceId: p.serviceId, date, ownerId, excludeBookingId: p.excludeBookingId });
    getJson<{ slots: DashSlot[] }>(`/api/dashboard/${p.slug}/slots?${qs}`, { signal: ctrl.signal })
      .then((d) => setSlots(d.slots))
      // Сүлжээний алдааг "Сул цаг алга" гэж харуулахгүй (цэвэрлэх үеийн abort-оос бусад)
      .catch(() => { if (!ctrl.signal.aborted) setSlotsError(true); });
    return () => ctrl.abort();
  }, [p.slug, p.serviceId, date, ownerId, p.excludeBookingId, reloadKey]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <label className="flex flex-1 flex-col gap-1.5 text-sm font-medium">
          Өдөр
          <input type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)}
            className="min-h-11 rounded-xl border-[1.5px] border-field bg-white px-3 text-base font-normal" />
        </label>
        <label className="flex flex-1 flex-col gap-1.5 text-sm font-medium">
          {p.ownerTerm}
          <select value={ownerId ?? ""} onChange={(e) => setOwnerId(e.target.value || null)}
            className="min-h-11 rounded-xl border-[1.5px] border-field bg-white px-3 text-base font-normal">
            <option value="">Хэн ч болно</option>
            {p.owners.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        </label>
      </div>
      {slotsError ? (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-ground p-3 text-sm">
          <span>Сул цагийг ачаалж чадсангүй.</span>
          <button type="button" onClick={() => setReloadKey((k) => k + 1)} className="min-h-11 rounded-xl border-[1.5px] border-ink bg-white px-4 font-medium">
            Дахин оролдох
          </button>
        </div>
      ) : slots === null ? (
        <p className="text-sm text-muted" aria-live="polite">Сул цаг хайж байна…</p>
      ) : slots.length === 0 ? (
        <p className="rounded-xl bg-ground p-3 text-sm text-muted" aria-live="polite">Сул цаг алга.</p>
      ) : (
        <div className="grid max-h-56 grid-cols-[repeat(auto-fill,minmax(76px,1fr))] gap-2 overflow-y-auto">
          {slots.map((s) => (
            <button key={s.startMin} type="button" onClick={() => setStartMin(s.startMin)} aria-pressed={s.startMin === startMin}
              className={`min-h-11 rounded-xl border-[1.5px] text-sm font-semibold ${s.startMin === startMin ? "border-ink bg-brand" : "border-line bg-white"}`}>
              {s.label}
            </button>
          ))}
        </div>
      )}
      <button
        type="button"
        disabled={startMin == null || p.busy || p.disabled}
        onClick={() => {
          if (startMin == null) return;
          const slot = slots?.find((s) => s.startMin === startMin);
          p.onPick({ date, startMin, ownerId: ownerId ?? slot?.ownerIds[0] ?? null });
        }}
        className={btnPrimary}
      >
        {p.busy ? "Түр хүлээнэ үү…" : p.submitLabel}
      </button>
    </div>
  );
}

// ── Гараар захиалга нэмэх ─────────────────────────────────────────────────

function NewBookingDialog(p: Props & { onClose: () => void }) {
  const [serviceId, setServiceId] = useState(p.services[0]?.id ?? "");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [notify, setNotify] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <Modal title="Захиалга нэмэх" onClose={p.onClose}>
      {p.services.length === 0 ? (
        <p className="text-muted">Үйлчилгээ бүртгэгдээгүй байна.</p>
      ) : (
        <>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Үйлчилгээ
            <select value={serviceId} onChange={(e) => setServiceId(e.target.value)}
              className="min-h-12 rounded-xl border-[1.5px] border-field bg-white px-3 text-base font-normal">
              {p.services.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.durationMin} мин)</option>)}
            </select>
          </label>
          <Field id="nb-name" label="Үйлчлүүлэгчийн нэр" value={name} onChange={setName} />
          <Field id="nb-phone" label="Утасны дугаар" type="tel" value={phone} onChange={setPhone} placeholder="9911 2233" />
          <Field id="nb-notes" label="Тэмдэглэл (заавал биш)" value={notes} onChange={setNotes} />
          <label className="flex min-h-11 items-center gap-3 text-sm font-semibold">
            <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} className="size-5 accent-[#f5a800]" />
            Үйлчлүүлэгчид SMS илгээх
          </label>
          {error && <ErrorBox>{error}</ErrorBox>}
          <SlotPicker
            key={serviceId}
            slug={p.slug}
            serviceId={serviceId}
            owners={p.owners}
            ownerTerm={p.ownerTerm}
            bookingMode={p.bookingMode}
            initialDate={p.date < p.today ? p.today : p.date}
            initialOwner={null}
            submitLabel="Захиалга нэмэх"
            busy={pending}
            disabled={!name.trim() || !phone.trim()}
            onPick={(s) =>
              start(async () => {
                setError(null);
                const r = await createManualBooking({ slug: p.slug, serviceId, name, phone, notes, notify, ...s });
                if (r.ok) p.onClose();
                else setError(r.message);
              })
            }
          />
        </>
      )}
    </Modal>
  );
}
