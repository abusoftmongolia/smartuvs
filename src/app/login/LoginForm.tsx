"use client";
import Link from "next/link";
import { useState, useTransition } from "react";
import { ErrorBox, Field, btnPrimary } from "@/components/ui";
import { login } from "@/server/auth-actions";

export function LoginForm({ next }: { next?: string }) {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <form
      className="flex flex-col gap-4 rounded-[18px] border border-line bg-white p-5"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        start(async () => {
          const r = await login({ phone, password, next });
          if (r && !r.ok) setError(r.message);
        });
      }}
    >
      <Field id="phone" label="Утасны дугаар" type="tel" value={phone} onChange={setPhone} placeholder="9911 2233" autoComplete="username" required />
      <Field id="password" label="Нууц үг" type="password" value={password} onChange={setPassword} autoComplete="current-password" required />
      {error && <ErrorBox>{error}</ErrorBox>}
      <button type="submit" disabled={pending} className={btnPrimary}>{pending ? "Түр хүлээнэ үү…" : "Нэвтрэх"}</button>
      <div className="flex flex-wrap justify-between gap-2 text-sm">
        <Link href="/login/reset" className="inline-flex min-h-11 items-center font-semibold text-brand-deep underline">Нууц үгээ мартсан</Link>
        <Link href="/signup" className="inline-flex min-h-11 items-center font-semibold text-brand-deep underline">Бүртгүүлэх</Link>
      </div>
    </form>
  );
}
