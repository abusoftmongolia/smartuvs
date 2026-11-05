/**
 * SMS илгээгч — adapter хэлбэрээр. Үйлчилгээ үзүүлэгчийг солиход зөвхөн шинэ класс нэмнэ.
 * SMS_PROVIDER=console үед терминалд хэвлэнэ (хөгжүүлэлтэд).
 */
export interface SmsProvider {
  send(to: string, text: string): Promise<{ ok: true; id?: string } | { ok: false; error: string }>;
}

class ConsoleSmsProvider implements SmsProvider {
  async send(to: string, text: string) {
    console.log(`\n[SMS → ${to.slice(0, 2)}****${to.slice(-2)}]\n${text}\n`);
    return { ok: true as const };
  }
}

/**
 * Ерөнхий HTTP gateway — гэрээ хийсэн Монголын SMS үйлчилгээ үзүүлэгчийн API-д тааруулж засна.
 * TODO: үйлчилгээ үзүүлэгчийн баримт бичгийн дагуу body, header-ийг тохируул.
 */
class HttpSmsProvider implements SmsProvider {
  constructor(private url: string, private key: string, private sender: string) {}
  async send(to: string, text: string) {
    try {
      const res = await fetch(this.url, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${this.key}` },
        body: JSON.stringify({ to, from: this.sender, text }),
      });
      if (!res.ok) return { ok: false as const, error: `HTTP ${res.status}` };
      return { ok: true as const };
    } catch (e) {
      return { ok: false as const, error: e instanceof Error ? e.message : String(e) };
    }
  }
}

let provider: SmsProvider | undefined;

export function sms(): SmsProvider {
  if (provider) return provider;
  const kind = process.env.SMS_PROVIDER ?? "console";
  if (kind === "console") provider = new ConsoleSmsProvider();
  else provider = new HttpSmsProvider(process.env.SMS_API_URL ?? "", process.env.SMS_API_KEY ?? "", process.env.SMS_SENDER ?? "");
  return provider;
}

/** Монгол утасны дугаарыг нэг хэлбэрт оруулна: "9911-2233", "+976 99112233" → "99112233" */
export function normalizePhone(input: string): string | null {
  const digits = input.replace(/\D/g, "").replace(/^976/, "");
  return /^[6-9]\d{7}$/.test(digits) ? digits : null;
}

/** SMS текстүүд — кирилл, богино (1 SMS ≈ 70 тэмдэгт кирилл) */
export const smsText = {
  otp: (code: string) => `Таны баталгаажуулах код: ${code}. 5 минут хүчинтэй. tsag.smartuvs.mn`,
  confirmed: (p: { tenant: string; day: string; time: string; link: string }) =>
    `${p.tenant}: ${p.day} ${p.time} цаг баталгаажлаа. Өөрчлөх: ${p.link}`,
  pending: (p: { tenant: string; day: string; time: string }) =>
    `${p.tenant}: ${p.day} ${p.time} захиалга хүлээн авлаа. Батлахад SMS ирнэ.`,
  rescheduled: (p: { tenant: string; day: string; time: string; link: string }) =>
    `${p.tenant}: таны цагийг ${p.day} ${p.time} болгож өөрчиллөө. Тохирохгүй бол: ${p.link}`,
  reminder: (p: { tenant: string; day: string; time: string; link: string }) =>
    `Сануулга: ${p.tenant}, ${p.day} ${p.time}. Өөрчлөх: ${p.link}`,
  tenantApproved: (p: { tenant: string; link: string }) =>
    `${p.tenant} батлагдлаа! Захиалгын хуудас: ${p.link}`,
  tenantRejected: (p: { tenant: string }) =>
    `${p.tenant}-ийн бүртгэл батлагдсангүй. Лавлах: tsag.smartuvs.mn`,
  cancelled: (p: { tenant: string; day: string; time: string }) =>
    `${p.tenant}: ${p.day} ${p.time} захиалга цуцлагдлаа.`,
};
