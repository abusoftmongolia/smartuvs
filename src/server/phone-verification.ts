import "server-only";
/**
 * Утас баталгаажуулалтын серверийн логик. Server action-ууд (verify-actions.ts) болон
 * createBooking эндээс дуудна. Энэ файл "use server" биш тул клиентээс шууд дуудагдахгүй.
 */
import { generateCode, readVerifyToken, signVerifyToken, VERIFY_TOKEN_TTL_MS } from "@/lib/phone-verify";
import { phoneVerifier } from "@/lib/verifymn";

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error("SESSION_SECRET 32+ тэмдэгт байх ёстой (.env)");
  return s;
}

/** Лог руу дугаарыг бүтнээр нь бичихгүй */
export function maskPhone(phone: string): string {
  return `${phone.slice(0, 2)}****${phone.slice(-2)}`;
}

export type StartedVerification = {
  token: string;
  shortcode: string;
  code: string;
  smsUri: string;
  expiresAt: string;
};

export async function startVerification(phone: string): Promise<StartedVerification | null> {
  const v = phoneVerifier();
  const code = generateCode();
  const r = await v.create(phone, code);
  if (!r.ok) {
    console.error(`[verify:${v.name}] session үүсгэж чадсангүй (${maskPhone(phone)}): ${r.error}`);
    return null;
  }
  const token = signVerifyToken(
    { sid: r.session.sessionId, phone, exp: Date.now() + VERIFY_TOKEN_TTL_MS },
    secret(),
  );
  return {
    token,
    shortcode: r.session.shortcode,
    code: r.session.text,
    smsUri: r.session.smsUri,
    expiresAt: r.session.expiresAt,
  };
}

export type VerificationState = "pending" | "verified" | "expired" | "invalid";

export async function verificationState(token: string): Promise<VerificationState> {
  const claims = readVerifyToken(token, secret(), Date.now());
  if (!claims) return "invalid";
  const s = await phoneVerifier().status(claims.sid);
  if (s === "VERIFIED") return "verified";
  if (s === "EXPIRED") return "expired";
  return "pending"; // PENDING эсвэл түр сүлжээний алдаа — дахин шалгана
}

/** Захиалга үүсгэхийн өмнө: токен энэ дугаарынх бөгөөд verify.mn дээр VERIFIED эсэх */
export async function isPhoneVerified(token: string, phone: string): Promise<boolean> {
  const claims = readVerifyToken(token, secret(), Date.now());
  if (!claims || claims.phone !== phone) return false;
  return (await phoneVerifier().status(claims.sid)) === "VERIFIED";
}
