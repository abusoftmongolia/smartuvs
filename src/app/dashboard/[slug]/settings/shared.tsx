"use client";
/** Удирдах хуудсуудын нийтлэг client хэсгүүд: хадгалах hook, тоон талбар, жижиг input */
import { useEffect, useState, useTransition } from "react";
import { ErrorBox, inputCls } from "@/components/ui";
import type { SettingsResult } from "@/server/settings-actions";

export const num = `min-h-11 w-full px-2.5 text-sm font-normal ${inputCls}`;

/**
 * Хадгалах үйлдэл + алдаа/амжилтын мэдэгдэл.
 * onFail — optimistic өөрчлөлтийг буцаахад (сервер татгалзсан эсвэл сүлжээний алдаа).
 */
export function useSave() {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const save = (
    fn: () => Promise<SettingsResult>,
    okText = "Хадгалагдлаа",
    after?: (r: Extract<SettingsResult, { ok: true }>) => void,
    onFail?: () => void,
  ) =>
    start(async () => {
      setMsg(null);
      let r: SettingsResult;
      try {
        r = await fn();
      } catch {
        r = { ok: false, message: "Сүлжээний алдаа. Дахин оролдоно уу." };
      }
      setMsg(r.ok ? { ok: true, text: okText } : { ok: false, text: r.message });
      if (r.ok) after?.(r);
      else onFail?.();
    });
  const fail = (message: string) => setMsg({ ok: false, text: message });
  const status = msg && (msg.ok
    ? <p role="status" className="text-sm font-semibold text-green-800">✓ {msg.text}</p>
    : <ErrorBox>{msg.text}</ErrorBox>);
  return { pending, save, fail, status };
}

/**
 * Тоон талбар: хоосон үед 0 биш null буцаана (Number("") === 0 алдаанаас сэргийлнэ).
 * Бичиж байх үеийн утгыг string-ээр хадгална.
 */
export function NumInput(p: {
  value: number | null;
  onChange: (v: number | null) => void;
  min?: number;
  max?: number;
  className?: string;
  "aria-label"?: string;
}) {
  const [text, setText] = useState(p.value == null ? "" : String(p.value));
  // Гаднаас утга өөрчлөгдвөл (жишээ нь буцаалт) дагана
  useEffect(() => {
    setText((t) => ((t === "" ? null : Number(t)) === p.value ? t : p.value == null ? "" : String(p.value)));
  }, [p.value]);
  return (
    <input
      type="number"
      inputMode="numeric"
      min={p.min}
      max={p.max}
      aria-label={p["aria-label"]}
      className={p.className ?? num}
      value={text}
      onChange={(e) => {
        const t = e.target.value;
        setText(t);
        p.onChange(t === "" || Number.isNaN(Number(t)) ? null : Number(t));
      }}
    />
  );
}

/** Жагсаалтын мөрд тогтвортой key (index биш) — шинэ мөрд client дээр үүсгэнэ */
let seq = 0;
export const newKey = () => `new-${++seq}`;
