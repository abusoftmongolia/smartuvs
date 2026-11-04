"use client";
import { useState, useTransition } from "react";
import { ExpiredNotice, PhoneVerifyPanel, usePhoneVerification } from "@/components/PhoneVerify";
import { ErrorBox, Field, btnPrimary } from "@/components/ui";
import { PASSWORD_MIN } from "@/lib/password-rules";
import { resetPassword } from "@/server/auth-actions";

export function ResetForm() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function save(verifyToken: string) {
    start(async () => {
      const r = await resetPassword({ phone, password, verifyToken });
      if (r && !r.ok) setError(r.message);
    });
  }
  const pv = usePhoneVerification((token) => save(token));
  const v = pv.verification;

  return (
    <form
      className="flex flex-col gap-4 rounded-[18px] border border-line bg-white p-5"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        if (password.length < PASSWORD_MIN) return setError(`Нууц үг хамгийн багадаа ${PASSWORD_MIN} тэмдэгт байна`);
        if (v?.state === "verified" && v.phone === phone) return save(v.token);
        void pv.start(phone);
      }}
    >
      <Field id="phone" label="Утасны дугаар" type="tel" value={phone} onChange={(x) => { setPhone(x); pv.reset(); }} placeholder="9911 2233" autoComplete="username" required />
      <Field id="password" label="Шинэ нууц үг" type="password" value={password} onChange={setPassword} autoComplete="new-password" hint={`${PASSWORD_MIN}+ тэмдэгт`} required />
      {(error || pv.error) && <ErrorBox>{error ?? pv.error}</ErrorBox>}
      {v?.state === "pending" ? (
        <PhoneVerifyPanel v={v} onCancel={pv.reset} />
      ) : (
        <>
          {v?.state === "expired" && <ExpiredNotice />}
          <button type="submit" disabled={pending || pv.starting} className={btnPrimary}>
            {pending || pv.starting ? "Түр хүлээнэ үү…" : "Үргэлжлүүлэх"}
          </button>
        </>
      )}
    </form>
  );
}
