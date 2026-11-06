"use client";
/**
 * verify.mn-ээр утас баталгаажуулах — захиалга, бүртгэл, нууц үг сэргээхэд дахин ашиглана.
 * Үйлчлүүлэгч өөрийн утаснаас shortcode руу код илгээнэ; бид 3 сек тутам шалгана.
 *
 * verify.mn-ийн UX зөвлөмж (амжилтгүй 9.8%-ийн шалтгаан):
 *  1. Өөр дугаар/SIM-ээс илгээх (8.7%) → displayInstruction-ыг өөрчлөлтгүй, илгээх дугаарыг том тод харуулна.
 *  2. Хугацаа дууссаны дараа илгээх (0.96%) → expiresAt-аар countdown; дуусмагц кодыг нууж «Шинэ код авах».
 *  3. Текст зөрүүтэй бичих (0.10%) → «Мессеж илгээх» товч smsUri-гаар дугаар, текстийг урьдчилан бөглөнө.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { checkPhoneVerification, startPhoneVerification } from "@/server/verify-actions";

export type Verification = {
  token: string;
  phone: string;
  shortcode: string;
  code: string;
  smsUri: string;
  expiresAt: number;
  /** verify.mn-ийн заавар (өөрчлөлтгүй). null бол өөрсдөө ижил бүтэцтэйгээр бичнэ. */
  displayInstruction: string | null;
  state: "pending" | "verified" | "expired";
};

const POLL_MS = 3000;

export function usePhoneVerification(onVerified: (token: string, phone: string) => void) {
  const [verification, setVerification] = useState<Verification | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const cb = useRef(onVerified);
  cb.current = onVerified;
  const verRef = useRef(verification);
  verRef.current = verification;
  // Санал асуулга ба хугацааны шалгалт зэрэг "verified" авбал нэг л удаа дуудна
  const fired = useRef<string | null>(null);
  const fireVerified = useCallback((token: string, phone: string) => {
    if (fired.current === token) return;
    fired.current = token;
    cb.current(token, phone);
  }, []);

  const start = useCallback(async (phone: string) => {
    setError(null);
    setStarting(true);
    try {
      const r = await startPhoneVerification({ phone });
      if (!r.ok) {
        setError(r.message);
        return;
      }
      setVerification({
        token: r.token, phone, shortcode: r.shortcode, code: r.code, smsUri: r.smsUri,
        expiresAt: Date.parse(r.expiresAt), displayInstruction: r.displayInstruction, state: "pending",
      });
    } catch {
      setError("Сүлжээний алдаа. Дахин оролдоно уу.");
    } finally {
      setStarting(false);
    }
  }, []);

  const pendingToken = verification?.state === "pending" ? verification.token : null;
  useEffect(() => {
    if (!pendingToken) return;
    let stopped = false;
    const poll = setInterval(async () => {
      const s = await checkPhoneVerification(pendingToken).catch(() => "pending" as const);
      if (stopped || s === "pending") return;
      stopped = true;
      const phone = verRef.current?.token === pendingToken ? verRef.current.phone : "";
      setVerification((v) => (v && v.token === pendingToken ? { ...v, state: s === "verified" ? "verified" : "expired" } : v));
      if (s === "verified") fireVerified(pendingToken, phone);
    }, POLL_MS);
    return () => { stopped = true; clearInterval(poll); };
  }, [pendingToken, fireVerified]);

  // expiresAt хүрмэгц сервер хүлээлгүй "expired" — хуучин кодыг нууж, шинэ код санал болгоно.
  // Сүүлчийн SMS сүлжээгээр саатаж болох тул 1 удаа сүүлийн төлөвийг шалгана.
  const pendingExpiry = verification?.state === "pending" ? verification.expiresAt : null;
  useEffect(() => {
    if (!pendingToken || pendingExpiry == null) return;
    const t = setTimeout(async () => {
      const s = await checkPhoneVerification(pendingToken).catch(() => "pending" as const);
      const verified = s === "verified";
      setVerification((v) => (v && v.token === pendingToken && v.state === "pending" ? { ...v, state: verified ? "verified" : "expired" } : v));
      if (verified && verRef.current?.token === pendingToken) fireVerified(pendingToken, verRef.current.phone);
    }, Math.max(0, pendingExpiry - Date.now()));
    return () => clearTimeout(t);
  }, [pendingToken, pendingExpiry, fireVerified]);

  const reset = useCallback(() => { setVerification(null); setError(null); }, []);
  /** Хугацаа дууссаны дараа ижил дугаараар шинэ код авна */
  const restart = useCallback(() => {
    const phone = verRef.current?.phone;
    if (phone) void start(phone);
  }, [start]);

  return { verification, error, starting, start, reset, restart };
}

/** "99112233" → "9911 2233" — уншихад амар */
const spaced = (n: string) => (/^\d{8}$/.test(n) ? `${n.slice(0, 4)} ${n.slice(4)}` : n);

export function PhoneVerifyPanel({ v, onCancel }: { v: Verification; onCancel: () => void }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const left = Math.max(0, Math.ceil((v.expiresAt - now) / 1000));
  const total = 5 * 60;
  const low = left <= 60;

  return (
    <div className="flex flex-col gap-3 rounded-xl border-2 border-brand bg-brand-tint p-4">
      <p className="text-[15px] font-bold">Утсаа баталгаажуулна уу</p>

      {/* 1. Хаанаас, хаашаа — хамгийн түгээмэл алдаа (өөр SIM/дугаар) */}
      <div className="grid grid-cols-2 gap-2 text-center">
        <div className="rounded-lg bg-white p-2.5">
          <div className="text-xs text-muted">Таны дугаараас</div>
          <div className="text-lg font-bold tabular-nums">{spaced(v.phone)}</div>
        </div>
        <div className="rounded-lg bg-white p-2.5">
          <div className="text-xs text-muted">Энэ дугаар руу</div>
          <div className="text-2xl font-bold tabular-nums">{v.shortcode}</div>
        </div>
      </div>

      <p className="text-sm">
        {v.displayInstruction ?? `Та өөрийн ${v.phone} дугаараас ${v.shortcode} дугаарт “${v.code}” гэж SMS илгээнэ үү. Хоёр SIM-тэй бол зөв SIM-ээ сонгоно уу.`}
      </p>

      <div className="rounded-lg bg-white py-2 text-center">
        <div className="text-xs text-muted">Илгээх код</div>
        <div className="font-mono text-3xl font-bold tracking-[0.2em]" aria-label={`Код ${v.code.split("").join(" ")}`}>{v.code}</div>
      </div>

      {/* 3. Дугаар, текст урьдчилан бөглөгдсөн — гараар бичих алдаагүй */}
      <a href={v.smsUri} className="flex min-h-12 items-center justify-center gap-2 rounded-card bg-ink text-base font-bold text-white">
        Мессеж илгээх
      </a>
      <p className="text-xs text-muted">Утсан дээр дарахад дугаар, код автоматаар бөглөгдөнө. Операторын SMS-ийн төлбөр (≈150₮) таны утаснаас гарна.</p>

      {/* 2. Үлдсэн хугацаа */}
      <div className="flex flex-col gap-1.5" aria-live="polite">
        <div className={`flex justify-between text-sm font-semibold ${low ? "text-red-700" : ""}`}>
          <span>SMS хүлээж байна…</span>
          <span className="tabular-nums" aria-label={`${Math.floor(left / 60)} минут ${left % 60} секунд үлдлээ`}>
            {Math.floor(left / 60)}:{String(left % 60).padStart(2, "0")}
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-white" aria-hidden>
          <div className={`h-full rounded-full transition-[width] duration-1000 ${low ? "bg-red-600" : "bg-brand"}`} style={{ width: `${Math.min(100, (left / total) * 100)}%` }} />
        </div>
      </div>

      <button type="button" onClick={onCancel} className="min-h-11 rounded-xl border border-line bg-white text-sm font-bold">
        Болих
      </button>
    </div>
  );
}

/** Хугацаа дууссан: хуучин код харагдахгүй, шинэ код авах товч */
export function ExpiredNotice({ onRestart, busy }: { onRestart?: () => void; busy?: boolean }) {
  return (
    <div role="alert" className="flex flex-col gap-2 rounded-xl bg-red-50 p-3">
      <p className="text-sm font-semibold text-red-800">
        Баталгаажуулах хугацаа (5 минут) дууслаа. Хуучин код хүчингүй болсон тул илгээхгүй байна уу.
      </p>
      {onRestart && (
        <button type="button" onClick={onRestart} disabled={busy}
          className="min-h-11 rounded-xl bg-ink px-4 text-sm font-bold text-white disabled:opacity-60">
          {busy ? "Түр хүлээнэ үү…" : "Шинэ код авах"}
        </button>
      )}
    </div>
  );
}
