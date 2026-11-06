import { describe, expect, it } from "vitest";
import { CODE_ALPHABET, CODE_LENGTH, formatBookingCode, generateBookingCode, normalizeBookingCode } from "@/lib/booking-code";

describe("generateBookingCode", () => {
  it("6 тэмдэгт, зөвшөөрөгдсөн цагаан толгойгоор", () => {
    for (let i = 0; i < 200; i++) {
      const c = generateBookingCode();
      expect(c).toHaveLength(CODE_LENGTH);
      expect([...c].every((ch) => CODE_ALPHABET.includes(ch))).toBe(true);
    }
  });
  it("андуурагдах тэмдэгтгүй", () => expect(CODE_ALPHABET).not.toMatch(/[0O1IL]/));
  it("хязгаараас дээшх байтыг алгасна (тэгш тархалт)", () => {
    // 255 > limit тул алгасагдаж, 0 → "A" гарна
    const c = generateBookingCode((n) => Uint8Array.from(Array.from({ length: n }, (_, i) => (i % 2 ? 0 : 255))));
    expect(c).toBe("AAAAAA");
  });
});

describe("normalizeBookingCode", () => {
  it("жижиг үсэг, #, зай, зураасыг цэвэрлэнэ", () => expect(normalizeBookingCode(" #x4k-9m2 ")).toBe("X4K9M2"));
  it("урт буруу бол null", () => expect(normalizeBookingCode("X4K9")).toBeNull());
  it("O → 0 гэж ойлгоод хүчингүй (0 цагаан толгойд байхгүй)", () => expect(normalizeBookingCode("OOOOOO")).toBeNull());
  it("формат", () => expect(formatBookingCode("X4K9M2")).toBe("#X4K9M2"));
});
