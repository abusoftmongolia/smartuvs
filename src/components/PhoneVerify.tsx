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
import { countdownAnnouncement, formatCountdown, showVerifyHelp } from "@/lib/booking-ui";
import { checkPhoneVerification, startPhoneVerification } from "@/server/verify-actions";

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
        const s = await checkPhoneVerification(token);
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
  const total = 5 * 60;
  const low = left <= 60;
  const help = showVerifyHelp(v.startedAt, now);

  return (
    <div className="flex flex-col gap-3 rounded-xl border-2 border-brand bg-brand-tint p-4">
      <p className="text-base font-semibold">Одоо {v.shortcode} руу SMS илгээнэ үү</p>

      {/* 1. Хаанаас, хаашаа — хамгийн түгээмэл алдаа (өөр SIM/дугаар) */}
      <div className="grid grid-cols-2 gap-2 text-center">
        <div className="rounded-lg bg-white p-2.5">
          <div className="text-xs text-muted">Таны дугаараас</div>
          <div className="text-lg font-semibold tabular-nums">{spaced(v.phone)}</div>
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
      <a href={v.smsUri} className={`flex min-h-12 items-center justify-center gap-2 rounded-card bg-ink text-[15px] font-semibold text-white ${focusRing}`}>
        Мессеж илгээх
      </a>
      <p className="text-sm">Дарахад дугаар, код автоматаар бөглөгдөнө — Мессеж апп-даа “Илгээх” дараад энд буцаж ирээрэй. Операторын SMS-ийн төлбөр (≈150₮) таны утаснаас гарна.</p>

      {/* 2. Үлдсэн хугацаа — харагдах цаг секунд бүр шинэчлэгдэх тул live биш; зөвхөн 1 минут үлдсэн/дууссан үед зарлана */}
      <div className="flex flex-col gap-1.5">
        <div className={`flex justify-between text-sm font-semibold ${low ? "text-red-700" : ""}`}>
          <span>SMS хүлээж байна…</span>
          <span className="tabular-nums" role="timer" aria-label={`${Math.floor(left / 60)} минут ${left % 60} секунд үлдлээ`}>
            {formatCountdown(left)}
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-white" aria-hidden>
          <div className={`h-full rounded-full transition-[width] duration-1000 ${low ? "bg-red-600" : "bg-brand"}`} style={{ width: `${Math.min(100, (left / total) * 100)}%` }} />
        </div>
        <p className="sr-only" aria-live="polite">{countdownAnnouncement(left)}</p>
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
              <li>Мессеж апп-д SMS илгээгдсэн эсэхийг харна уу. Илгээгдээгүй бол “Мессеж илгээх”-ийг дахин дарна уу.</li>
              <li>Текст нь яг “{v.code}”, хүлээн авагч нь {v.shortcode} байх ёстой.</li>
            </ul>
            {onCheck && (
              <button type="button" onClick={onCheck} className={`min-h-11 rounded-xl border-[1.5px] border-ink bg-white text-sm font-medium ${focusRing}`}>
                Дахин шалгах
              </button>
            )}
          </div>
        )}
      </div>

      <button type="button" onClick={onCancel} className={`min-h-11 rounded-xl border border-line bg-white text-sm font-medium ${focusRing}`}>
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
          className="min-h-11 rounded-xl bg-ink px-4 text-sm font-semibold text-white disabled:opacity-60">
          {busy ? "Түр хүлээнэ үү…" : "Шинэ код авах"}
        </button>
      )}
    </div>
  );
}
