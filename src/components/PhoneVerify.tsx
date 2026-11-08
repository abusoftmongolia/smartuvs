"use client";
/**
 * verify.mn-ээр утас баталгаажуулах — захиалга, бүртгэл, нууц үг сэргээхэд дахин ашиглана.
 * Үйлчлүүлэгч өөрийн утаснаас shortcode руу код илгээнэ; бид 3 сек тутам шалгана.
 *
 * verify.mn-ийн UX зөвлөмж (амжилтгүй 9.8%-ийн шалтгаан):
 *  1. Өөр дугаар/SIM-ээс илгээх (8.7%) → displayInstruction-ыг өөрчлөлтгүй, илгээх дугаарыг том тод харуулна.
 *  2. Хугацаа дууссаны дараа илгээх (0.96%) → expiresAt-аар countdown; дуусмагц кодыг нууж «Шинэ код авах».
 *  3. Текст зөрүүтэй бичих (0.10%) → заавар доторх холбоос smsUri-гаар дугаар, текстийг урьдчилан бөглөнө.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { countdownAnnouncement, showVerifyHelp } from "@/lib/booking-ui";
import { startPhoneVerification } from "@/server/verify-actions";
import { getJson } from "@/lib/fetch-json";
import type { VerificationState } from "@/server/phone-verification";

export type Verification = {
  token: string;
  phone: string;
  shortcode: string;
  code: string;
  smsUri: string;
  expiresAt: number;
  /** SMS хүлээж эхэлсэн мөч (туслах зөвлөмж харуулахад) */
  startedAt: number;
  /** verify.mn-ийн заавар (өөрчлөлтгүй). null бол өөрсдөө ижил бүтэцтэйгээр бичнэ. */
  displayInstruction: string | null;
  state: "pending" | "verified" | "expired";
};

const POLL_MS = 3000;
/** Дараалсан хэдэн удаа шалгалт амжилтгүй болбол сүлжээний алдаа харуулах */
const NET_ERROR_AFTER = 2;

type CheckState = "pending" | "verified" | "expired" | "error";

export function usePhoneVerification(onVerified: (token: string, phone: string) => void) {
  const [verification, setVerification] = useState<Verification | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [netError, setNetError] = useState(false);
  const cb = useRef(onVerified);
  cb.current = onVerified;
  const verRef = useRef(verification);
  verRef.current = verification;
  const failures = useRef(0);
  const inflight = useRef<Promise<CheckState> | null>(null);
  // Санал асуулга, буцаж ирэх, хугацааны шалгалт зэрэг "verified" авбал нэг л удаа дуудна
  const fired = useRef<string | null>(null);
  const fireVerified = useCallback((token: string, phone: string) => {
    if (fired.current === token) return;
    fired.current = token;
    cb.current(token, phone);
  }, []);

  const start = useCallback(async (phone: string) => {
    setError(null);
    setNetError(false);
    failures.current = 0;
    setStarting(true);
    try {
      const r = await startPhoneVerification({ phone });
      if (!r.ok) {
        setError(r.message);
        return;
      }
      setVerification({
        token: r.token, phone, shortcode: r.shortcode, code: r.code, smsUri: r.smsUri,
        expiresAt: Date.parse(r.expiresAt), startedAt: Date.now(), displayInstruction: r.displayInstruction, state: "pending",
      });
    } catch {
      setError("Сүлжээний алдаа. Дахин оролдоно уу.");
    } finally {
      setStarting(false);
    }
  }, []);

  /**
   * Одоогийн pending баталгаажуулалтыг серверээс шалгана. Зэрэг дуудвал нэг хүсэлт хуваалцана.
   * verified → onVerified; expired/invalid → "expired"; сүлжээний алдааг тоолж, netError тавина.
   */
  const checkNow = useCallback((): Promise<CheckState> => {
    const v = verRef.current;
    if (!v || v.state !== "pending") return Promise.resolve(v?.state === "verified" ? "verified" : "expired");
    if (inflight.current) return inflight.current;
    const { token, phone } = v;
    const p = (async (): Promise<CheckState> => {
      try {
        // GET — server action-ууд дараалан ажилладаг тул poll нь createBooking-ийг хүлээлгэхгүй
        const { state: s } = await getJson<{ state: VerificationState }>("/api/verify/status", {
          headers: { "x-verify-token": token },
          timeoutMs: 8_000,
        });
        failures.current = 0;
        setNetError(false);
        if (s === "pending") return "pending";
        if (verRef.current?.token !== token) return "pending";
        const verified = s === "verified";
        setVerification((x) => (x && x.token === token && x.state === "pending" ? { ...x, state: verified ? "verified" : "expired" } : x));
        if (verified) fireVerified(token, phone);
        return verified ? "verified" : "expired";
      } catch {
        failures.current += 1;
        if (failures.current >= NET_ERROR_AFTER) setNetError(true);
        return "error";
      } finally {
        inflight.current = null;
      }
    })();
    inflight.current = p;
    return p;
  }, [fireVerified]);

  const pendingToken = verification?.state === "pending" ? verification.token : null;

  // 3 сек тутам шалгана
  useEffect(() => {
    if (!pendingToken) return;
    const poll = setInterval(() => void checkNow(), POLL_MS);
    return () => clearInterval(poll);
  }, [pendingToken, checkNow]);

  // Мессеж апп-аас буцаж ирмэгц (таб харагдах, цонх focus, bfcache) 3 сек хүлээлгүй шууд шалгана
  useEffect(() => {
    if (!pendingToken) return;
    const onVisible = () => { if (document.visibilityState === "visible") void checkNow(); };
    const onFocus = () => void checkNow();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onFocus);
    window.addEventListener("pageshow", onFocus);
    window.addEventListener("online", onFocus);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("pageshow", onFocus);
      window.removeEventListener("online", onFocus);
    };
  }, [pendingToken, checkNow]);

  // expiresAt хүрмэгц сервер хүлээлгүй "expired" — хуучин кодыг нууж, шинэ код санал болгоно.
  // Сүүлчийн SMS сүлжээгээр саатаж болох тул 1 удаа сүүлийн төлөвийг шалгана.
  const pendingExpiry = verification?.state === "pending" ? verification.expiresAt : null;
  useEffect(() => {
    if (!pendingToken || pendingExpiry == null) return;
    const t = setTimeout(async () => {
      const s = await checkNow();
      if (s === "verified") return;
      setVerification((v) => (v && v.token === pendingToken && v.state === "pending" ? { ...v, state: "expired" } : v));
    }, Math.max(0, pendingExpiry - Date.now()));
    return () => clearTimeout(t);
  }, [pendingToken, pendingExpiry, checkNow]);

  const reset = useCallback(() => { setVerification(null); setError(null); setNetError(false); }, []);
  /** Хугацаа дууссаны дараа ижил дугаараар шинэ код авна */
  const restart = useCallback(() => {
    const phone = verRef.current?.phone;
    if (phone) void start(phone);
  }, [start]);

  return { verification, error, starting, netError, start, reset, restart, checkNow };
}

/** "95866262" → "95****62" — дэлгэцэнд бүтэн дугаар харуулахгүй, гэхдээ аль SIM болохыг танихад хангалттай */
const masked = (n: string) => (/^\d{8}$/.test(n) ? `${n.slice(0, 2)}****${n.slice(6)}` : n);

/** "99112233" → "9911 2233" — уншихад амар */
const spaced = (n: string) => (/^\d{8}$/.test(n) ? `${n.slice(0, 4)} ${n.slice(4)}` : n);

const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

export function PhoneVerifyPanel({ v, onCancel, netError, onCheck }: {
  v: Verification;
  onCancel: () => void;
  /** Шалгах хүсэлт дараалан амжилтгүй — сүлжээ тасарсан бололтой */
  netError?: boolean;
  /** "Дахин шалгах" — одоо шалгуулна */
  onCheck?: () => void;
}) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const left = Math.max(0, Math.ceil((v.expiresAt - now) / 1000));
  const low = left <= 60;
  const help = showVerifyHelp(v.startedAt, now);
  const [copied, setCopied] = useState(false);
  const card = "rounded-xl bg-white px-4 py-3.5";

  return (
    <div className="flex flex-col gap-3 rounded-[18px] bg-ground p-4">
      <p className="text-center text-lg font-bold">Баталгаажуулалт</p>

      {/* 1. Хаанаас — өөр SIM-ээс илгээх нь хамгийн түгээмэл алдаа */}
      <div className={`${card} flex items-center justify-between gap-3`}>
        <span className="whitespace-nowrap text-sm text-muted">Таны дугаар:</span>
        <span className="text-lg font-bold tabular-nums" aria-label={`${v.phone.split("").join(" ")}`}>{masked(v.phone)}</span>
      </div>

      {/* 2. Хаашаа, юу — дарахад дугаар, код бөглөгдсөн Мессеж апп нээгдэнэ */}
      <p className={`${card} text-sm leading-relaxed`}>
        Та дээрх дугаараасаа{" "}
        <a href={v.smsUri} className={`font-semibold text-brand-deep underline underline-offset-2 ${focusRing}`}>
          {v.shortcode} дугаар луу дараах кодыг мессежээр илгээж
        </a>{" "}
        түр хүлээнэ үү. <span className="text-muted">(энгийн мессежний тарифаар тооцогдоно)</span>
      </p>

      {/* 3. Код + хуулах, үлдсэн хугацаа. Цаг секунд бүр шинэчлэгдэх тул live биш; 1 минут үлдсэн/дууссан үед л зарлана */}
      <div className={`${card} flex flex-wrap items-center justify-between gap-x-3 gap-y-1`}>
        <div className="flex items-center gap-1">
          <span className="font-mono text-3xl font-bold tracking-[0.08em]" aria-label={`Код ${v.code.split("").join(" ")}`}>{v.code}</span>
          <button type="button" aria-label={copied ? "Код хуулагдлаа" : "Кодыг хуулах"}
            onClick={() => navigator.clipboard?.writeText(v.code).then(() => setCopied(true))}
            className={`inline-flex size-11 items-center justify-center rounded-lg text-muted hover:text-ink ${focusRing}`}>
            {copied ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><rect x="9" y="9" width="11" height="11" rx="2.5" /><path d="M5 15V6.5A2.5 2.5 0 0 1 7.5 4H15" /></svg>
            )}
          </button>
        </div>
        <span className={`ml-auto whitespace-nowrap text-sm font-medium tabular-nums ${low ? "text-red-700" : "text-brand-deep"}`} role="timer"
          aria-label={`${Math.floor(left / 60)} минут ${left % 60} секунд үлдлээ`}>
          {left} секунд
        </span>
        <span className="sr-only" aria-live="polite">{countdownAnnouncement(left)}</span>
      </div>

      {/* 4. Буруу дугаар бол буцаж засна */}
      <div className={`${card} text-sm`}>
        <p className="text-muted">Дээрх дугаар буруу юу?</p>
        <button type="button" onClick={onCancel} className={`min-h-11 font-medium text-brand-deep underline-offset-2 hover:underline ${focusRing}`}>
          Утасны дугаараа солих
        </button>
      </div>

      {netError && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-800">
          Интернэт холболт тасарсан бололтой. Холболт сэргэмэгц автоматаар шалгана — SMS-ээ дахин илгээх шаардлагагүй.
        </p>
      )}

      {/* 45 сек өнгөрөөд баталгаажаагүй бол — хамгийн түгээмэл шалтгаанууд */}
      <div aria-live="polite">
        {help && (
          <div className="flex flex-col gap-2 rounded-lg bg-white p-3 text-sm">
            <p className="font-semibold">SMS илгээсэн ч баталгаажихгүй байна уу?</p>
            <ul className="flex list-disc flex-col gap-1 pl-5">
              <li>Хоёр SIM-тэй бол <b className="font-semibold tabular-nums">{spaced(v.phone)}</b> дугаартай SIM-ээс илгээсэн эсэхээ шалгана уу.</li>
              <li>Мессеж апп-д SMS илгээгдсэн эсэхийг харна уу. Илгээгдээгүй бол дээрх холбоосыг дахин дарна уу.</li>
              <li>Текст нь яг “{v.code}”, хүлээн авагч нь {v.shortcode} байх ёстой.</li>
            </ul>
          </div>
        )}
      </div>

      {onCheck && (
        <button type="button" onClick={onCheck} className={`min-h-12 rounded-card bg-brand text-[15px] font-semibold text-ink ${focusRing}`}>
          Шалгах
        </button>
      )}
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
          className="min-h-11 rounded-xl bg-ink px-4 text-sm font-semibold text-white disabled:opacity-60">
          {busy ? "Түр хүлээнэ үү…" : "Шинэ код авах"}
        </button>
      )}
    </div>
  );
}
