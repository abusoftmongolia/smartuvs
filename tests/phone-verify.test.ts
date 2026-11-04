import { describe, expect, it } from "vitest";
import { generateCode, readVerifyToken, signVerifyToken } from "@/lib/phone-verify";

const SECRET = "x".repeat(32);
const NOW = 1_800_000_000_000;
const claims = { sid: "4d4c95ff-0fd4-4d9e-900d-6d18fb8ce6a7", phone: "99112233", exp: NOW + 60_000 };

describe("generateCode", () => {
  it("үргэлж 6 оронтой тоо", () => {
    for (let i = 0; i < 500; i++) expect(generateCode()).toMatch(/^\d{6}$/);
  });
});

describe("verify token", () => {
  it("гарын үсэгтэй токеныг буцааж уншина", () => {
    expect(readVerifyToken(signVerifyToken(claims, SECRET), SECRET, NOW)).toEqual(claims);
  });

  it("хугацаа дууссан бол null", () => {
    expect(readVerifyToken(signVerifyToken(claims, SECRET), SECRET, claims.exp)).toBeNull();
  });

  it("өөр нууц түлхүүрээр шалгавал null", () => {
    expect(readVerifyToken(signVerifyToken(claims, SECRET), "y".repeat(32), NOW)).toBeNull();
  });

  it("агуулгыг өөрчилбөл (өөр дугаар) null", () => {
    const [, sig] = signVerifyToken(claims, SECRET).split(".");
    const forged = Buffer.from(JSON.stringify({ ...claims, phone: "88001122" })).toString("base64url");
    expect(readVerifyToken(`${forged}.${sig}`, SECRET, NOW)).toBeNull();
  });

  it("буруу хэлбэртэй токен null", () => {
    for (const t of ["", "abc", "a.b.c", ".", "a."]) expect(readVerifyToken(t, SECRET, NOW)).toBeNull();
  });
});
