/**
 * Утас баталгаажуулах үйлчилгээ — adapter хэлбэрээр (sms.ts-тэй адил).
 *
 * verify.mn: үйлчлүүлэгч өөрийн утаснаас 144773 руу код илгээж баталгаажуулна (MO SMS).
 *   POST {base}/sessions  (Bearer түлхүүр) → session нээнэ
 *   GET  {base}/sessions/:id              → PENDING | VERIFIED | EXPIRED
 * mock: VERIFYMN_API_KEY байхгүй, production биш үед. 5 секундын дараа өөрөө VERIFIED болно.
 */

export type VerifySession = {
  sessionId: string;
  shortcode: string;
  /** Илгээх текст (код) */
  text: string;
  /** "sms:144773?body=482916" — утсан дээр SMS бичих цонх нээнэ */
  smsUri: string;
  expiresAt: string;
};

export type VerifyStatus = "PENDING" | "VERIFIED" | "EXPIRED";

export interface PhoneVerifier {
  readonly name: string;
  create(phone: string, code: string): Promise<{ ok: true; session: VerifySession } | { ok: false; error: string }>;
  /** null = олдсонгүй эсвэл сүлжээний алдаа */
  status(sessionId: string): Promise<VerifyStatus | null>;
}

const TIMEOUT_MS = 8000;

class VerifyMnVerifier implements PhoneVerifier {
  readonly name = "verifymn";
  constructor(private base: string, private key: string) {}

  async create(phone: string, code: string) {
    try {
      const res = await fetch(`${this.base}/sessions`, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${this.key}` },
        body: JSON.stringify({ phone, text: code }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
        cache: "no-store",
      });
      if (!res.ok) return { ok: false as const, error: `HTTP ${res.status}` };
      const d = (await res.json()) as Partial<VerifySession>;
      if (!d.sessionId || !d.shortcode || !d.expiresAt) return { ok: false as const, error: "bad_response" };
      return {
        ok: true as const,
        session: {
          sessionId: d.sessionId,
          shortcode: d.shortcode,
          text: d.text ?? code,
          smsUri: d.smsUri ?? `sms:${d.shortcode}?body=${encodeURIComponent(code)}`,
          expiresAt: d.expiresAt,
        },
      };
    } catch (e) {
      return { ok: false as const, error: e instanceof Error ? e.message : String(e) };
    }
  }

  async status(sessionId: string) {
    try {
      const res = await fetch(`${this.base}/sessions/${encodeURIComponent(sessionId)}`, {
        signal: AbortSignal.timeout(TIMEOUT_MS),
        cache: "no-store",
      });
      if (!res.ok) return null;
      const d = (await res.json()) as { sessionStatus?: string };
      return d.sessionStatus === "PENDING" || d.sessionStatus === "VERIFIED" || d.sessionStatus === "EXPIRED"
        ? d.sessionStatus
        : null;
    } catch {
      return null;
    }
  }
}

/** Хөгжүүлэлтэд: төлөвгүй, sessionId дотор үүссэн цагаа хадгална */
class MockVerifier implements PhoneVerifier {
  readonly name = "mock";
  async create(_phone: string, code: string) {
    const now = Date.now();
    console.log(`\n[verify mock] 144773 ← "${code}" (5 секундын дараа автоматаар баталгаажна)\n`);
    return {
      ok: true as const,
      session: {
        sessionId: `mock_${now}`,
        shortcode: "144773",
        text: code,
        smsUri: `sms:144773?body=${code}`,
        expiresAt: new Date(now + 5 * 60_000).toISOString(),
      },
    };
  }
  async status(sessionId: string) {
    const created = Number(sessionId.replace(/^mock_/, ""));
    if (!Number.isFinite(created)) return null;
    const age = Date.now() - created;
    if (age > 5 * 60_000) return "EXPIRED" as const;
    return age > 5000 ? ("VERIFIED" as const) : ("PENDING" as const);
  }
}

let verifier: PhoneVerifier | undefined;

export function phoneVerifier(): PhoneVerifier {
  if (verifier) return verifier;
  const key = process.env.VERIFYMN_API_KEY;
  if (key) {
    verifier = new VerifyMnVerifier((process.env.VERIFYMN_API_URL || "https://api.verify.mn").replace(/\/$/, ""), key);
  } else if (process.env.NODE_ENV !== "production") {
    verifier = new MockVerifier();
  } else {
    throw new Error("VERIFYMN_API_KEY тохируулаагүй байна");
  }
  return verifier;
}
