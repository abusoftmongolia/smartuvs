/** Session токен: cookie-д түүхий утга, санд sha256 hash (сан алдагдсан ч cookie хуурамчлах боломжгүй). */
import { createHash, randomBytes } from "node:crypto";

export const SESSION_COOKIE = "tsag_session";
export const SESSION_TTL_MS = 30 * 24 * 3600_000;

export function newSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Лог/audit-д утасны дугаарыг бүтнээр нь хадгалахгүйн тулд (rate limit-ийн түлхүүр) */
export function phoneKey(phone: string, secret: string): string {
  return createHash("sha256").update(`${secret}:${phone}`).digest("hex").slice(0, 32);
}
