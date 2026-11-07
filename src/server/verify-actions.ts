"use server";
/** Утас баталгаажуулалт эхлүүлэх server action. Төлөвийг GET /api/verify/status-аас уншина. */
import { z } from "zod";
import { normalizePhone } from "@/lib/sms";
import { startVerification } from "./phone-verification";

export type StartVerificationResult =
  | { ok: true; token: string; shortcode: string; code: string; smsUri: string; expiresAt: string; displayInstruction: string | null }
  | { ok: false; message: string };

export async function startPhoneVerification(raw: unknown): Promise<StartVerificationResult> {
  const parsed = z.object({ phone: z.string().max(32) }).safeParse(raw);
  const phone = parsed.success ? normalizePhone(parsed.data.phone) : null;
  if (!phone) return { ok: false, message: "Утасны дугаар 8 оронтой байх ёстой" };

  const started = await startVerification(phone);
  if (!started) return { ok: false, message: "Баталгаажуулалт эхлүүлж чадсангүй. Дахин оролдоно уу." };
  return { ok: true, ...started };
}
