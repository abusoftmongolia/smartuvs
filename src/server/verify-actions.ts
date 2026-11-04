"use server";
/** Утас баталгаажуулах server action-ууд — захиалгын хуудаснаас дуудагдана. */
import { z } from "zod";
import { normalizePhone } from "@/lib/sms";
import { startVerification, verificationState, type VerificationState } from "./phone-verification";

export type StartVerificationResult =
  | { ok: true; token: string; shortcode: string; code: string; smsUri: string; expiresAt: string }
  | { ok: false; message: string };

export async function startPhoneVerification(raw: unknown): Promise<StartVerificationResult> {
  const parsed = z.object({ phone: z.string().max(32) }).safeParse(raw);
  const phone = parsed.success ? normalizePhone(parsed.data.phone) : null;
  if (!phone) return { ok: false, message: "Утасны дугаар 8 оронтой байх ёстой" };

  const started = await startVerification(phone);
  if (!started) return { ok: false, message: "Баталгаажуулалт эхлүүлж чадсангүй. Дахин оролдоно уу." };
  return { ok: true, ...started };
}

export async function checkPhoneVerification(raw: unknown): Promise<VerificationState> {
  const parsed = z.string().min(1).max(1024).safeParse(raw);
  if (!parsed.success) return "invalid";
  return verificationState(parsed.data);
}
