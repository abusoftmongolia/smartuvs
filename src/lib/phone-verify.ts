/**
 * Утас баталгаажуулалтын цэвэр логик (verify.mn-ийн MO SMS урсгал).
 *
 * Урсгал: бид 6 оронтой код үүсгэнэ → verify.mn дээр session нээнэ → үйлчлүүлэгч өөрийн
 * утаснаас 144773 руу тэр кодыг SMS-ээр илгээнэ → session VERIFIED болно.
 *
 * Клиент рүү session-ий ID-г HMAC гарын үсэгтэй токен болгож өгнө. Ингэснээр өөр
 * дугаарын session-ийг өөрийн захиалгад ашиглах боломжгүй, нэмэлт хүснэгт ч хэрэггүй.
 */
import { createHmac, randomInt, timingSafeEqual } from "node:crypto";

/** Баталгаажсаны дараа токен хэр удаан хүчинтэй (захиалгаа дуусгах хугацаа) */
export const VERIFY_TOKEN_TTL_MS = 30 * 60_000;

export type VerifyClaims = {
  /** verify.mn-ийн sessionId */
  sid: string;
  /** Нормчилсон 8 оронтой дугаар */
  phone: string;
  /** Дуусах хугацаа, epoch ms */
  exp: number;
};

/** 000000–999999 хооронд санамсаргүй код (тэргүүлэх тэгтэй) */
export function generateCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function signVerifyToken(claims: VerifyClaims, secret: string): string {
  const payload = Buffer.from(JSON.stringify(claims)).toString("base64url");
  return `${payload}.${sign(payload, secret)}`;
}

/** Гарын үсэг, бүтэц, хугацааг шалгана. Буруу бол null. */
export function readVerifyToken(token: string, secret: string, now: number): VerifyClaims | null {
  const [payload, sig, extra] = token.split(".");
  if (!payload || !sig || extra !== undefined) return null;

  const expected = Buffer.from(sign(payload, secret));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;

  let claims: unknown;
  try {
    claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  const c = claims as Partial<VerifyClaims>;
  if (typeof c.sid !== "string" || typeof c.phone !== "string" || typeof c.exp !== "number") return null;
  if (c.exp <= now) return null;
  return { sid: c.sid, phone: c.phone, exp: c.exp };
}
