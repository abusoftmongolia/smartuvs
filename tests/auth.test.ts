import { describe, expect, it } from "vitest";
import { hashPassword, passwordProblem, verifyPassword } from "@/lib/password";
import { hashSessionToken, newSessionToken, phoneKey } from "@/lib/session-token";

describe("password", () => {
  it("зөв нууц үгийг таньж, бурууг татгалзана", async () => {
    const h = await hashPassword("tsag-1234");
    expect(h.startsWith("scrypt$")).toBe(true);
    expect(await verifyPassword("tsag-1234", h)).toBe(true);
    expect(await verifyPassword("tsag-1235", h)).toBe(false);
  });

  it("нэг нууц үг хоёр өөр hash өгнө (salt)", async () => {
    expect(await hashPassword("abcdefgh")).not.toBe(await hashPassword("abcdefgh"));
  });

  it("кирилл нууц үг ажиллана", async () => {
    const h = await hashPassword("Нууцүг2026");
    expect(await verifyPassword("Нууцүг2026", h)).toBe(true);
  });

  it("эвдэрсэн hash-д false", async () => {
    expect(await verifyPassword("x", "")).toBe(false);
    expect(await verifyPassword("x", "bcrypt$1$2")).toBe(false);
  });

  it("урт шалгана", () => {
    expect(passwordProblem("1234567")).not.toBeNull();
    expect(passwordProblem("12345678")).toBeNull();
    expect(passwordProblem("x".repeat(129))).not.toBeNull();
  });
});

describe("session token", () => {
  it("санамсаргүй бөгөөд hash тогтвортой", () => {
    const a = newSessionToken();
    expect(a).not.toBe(newSessionToken());
    expect(a.length).toBeGreaterThanOrEqual(43);
    expect(hashSessionToken(a)).toBe(hashSessionToken(a));
    expect(hashSessionToken(a)).toMatch(/^[0-9a-f]{64}$/);
  });

  it("phoneKey дугаарыг ил гаргахгүй", () => {
    const k = phoneKey("99112233", "s".repeat(32));
    expect(k).not.toContain("99112233");
    expect(k).toBe(phoneKey("99112233", "s".repeat(32)));
    expect(k).not.toBe(phoneKey("99112233", "t".repeat(32)));
  });
});
