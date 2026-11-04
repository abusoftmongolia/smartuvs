"use client";
/**
 * verify.mn-ээр утас баталгаажуулах — захиалга, бүртгэл, нууц үг сэргээхэд дахин ашиглана.
 * Үйлчлүүлэгч өөрийн утаснаас shortcode руу код илгээнэ; бид 3 сек тутам шалгана.
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
        expiresAt: Date.parse(r.expiresAt), state: "pending",
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
      if (s === "verified") cb.current(pendingToken, phone);
    }, POLL_MS);
    return () => { stopped = true; clearInterval(poll); };
  }, [pendingToken]);

  const reset = useCallback(() => { setVerification(null); setError(null); }, []);

  return { verification, error, starting, start, reset };
}

export function PhoneVerifyPanel({ v, onCancel }: { v: Verification; onCancel: () => void }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const left = Math.max(0, Math.round((v.expiresAt - now) / 1000));

  return (
    <div className="flex flex-col gap-3 rounded-xl border-2 border-brand bg-brand-tint p-4">
      <p className="text-[15px] font-extrabold">Утсаа баталгаажуулна уу</p>
      <p className="text-sm">
        Өөрийн <b>{v.phone}</b> дугаараас <b>{v.shortcode}</b> руу доорх кодыг SMS-ээр илгээнэ үү:
      </p>
      <p className="text-center text-3xl font-extrabold tracking-[0.2em]" aria-label={`Код ${v.code.split("").join(" ")}`}>
        {v.code}
      </p>
      <a href={v.smsUri} className="flex min-h-12 items-center justify-center rounded-card bg-brand text-base font-extrabold text-ink">
        SMS бичих
      </a>
      <p className="text-xs text-muted">
        Операторын SMS-ийн төлбөр (≈150₮) таны утаснаас гарна. 2 SIM-тэй бол зөв SIM-ээ сонгоно уу.
      </p>
      <p className="text-sm font-semibold" aria-live="polite">
        SMS хүлээж байна… {Math.floor(left / 60)}:{String(left % 60).padStart(2, "0")}
      </p>
      <button type="button" onClick={onCancel} className="min-h-11 rounded-xl border border-line bg-white text-sm font-bold">
        Болих
      </button>
    </div>
  );
}

export function ExpiredNotice() {
  return (
    <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-800">
      Баталгаажуулах хугацаа дууслаа. Дахин оролдоно уу.
    </p>
  );
}
