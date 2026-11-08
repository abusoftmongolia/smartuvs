import { describe, expect, it } from "vitest";
import { productionEnvProblems } from "@/lib/env-check";

const good = {
  DATABASE_URL: "postgres://x",
  SESSION_SECRET: "x".repeat(32),
  CRON_SECRET: "y".repeat(16),
  VERIFYMN_API_KEY: "k",
  NEXT_PUBLIC_SITE_URL: "https://tsag.smartuvs.mn",
  SMS_PROVIDER: "http",
  SMS_API_URL: "https://sms",
  SMS_API_KEY: "s",
};

describe("productionEnvProblems", () => {
  it("бүрэн тохиргоо — асуудалгүй", () => expect(productionEnvProblems(good)).toEqual([]));
  it("console SMS, богино secret, http хаягийг илрүүлнэ", () => {
    const names = productionEnvProblems({ ...good, SMS_PROVIDER: undefined, SESSION_SECRET: "short", NEXT_PUBLIC_SITE_URL: "http://x" }).map((p) => p.name);
    expect(names).toEqual(expect.arrayContaining(["SMS_PROVIDER", "SESSION_SECRET", "NEXT_PUBLIC_SITE_URL"]));
  });
  it("SMS_PROVIDER=off — SMS-гүй гаргах боломжтой", () => {
    expect(productionEnvProblems({ ...good, SMS_PROVIDER: "off", SMS_API_URL: undefined, SMS_API_KEY: undefined })).toEqual([]);
  });
  it("утгыг буцаахгүй, зөвхөн нэр", () => {
    const out = JSON.stringify(productionEnvProblems({ ...good, SESSION_SECRET: "supersecret" }));
    expect(out).not.toContain("supersecret");
  });
});
