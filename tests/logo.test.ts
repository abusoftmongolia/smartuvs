import { describe, expect, it } from "vitest";
import { avatarColors, detectImageMime, initials } from "@/lib/logo";

describe("detectImageMime", () => {
  it("PNG, JPEG, WebP-г байтаар таньна", () => {
    expect(detectImageMime(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe("image/png");
    expect(detectImageMime(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe("image/jpeg");
    expect(detectImageMime(new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]))).toBe("image/webp");
  });
  it("SVG, текст, хоосныг татгалзана", () => {
    expect(detectImageMime(new TextEncoder().encode("<svg xmlns='http://www.w3.org/2000/svg'>"))).toBeNull();
    expect(detectImageMime(new Uint8Array([]))).toBeNull();
    expect(detectImageMime(new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x41, 0x56, 0x49, 0x20]))).toBeNull(); // AVI
  });
});

describe("initials", () => {
  it("хоёр үгийн эхний үсэг", () => {
    expect(initials("Хатан Салон")).toBe("ХС");
    expect(initials("Увс Авто Угаалга")).toBe("УА");
  });
  it("нэг үг бол эхний хоёр үсэг", () => {
    expect(initials("Тест№1")).toBe("ТЕ");
    expect(initials("ö")).toBe("Ö");
  });
  it("үсэггүй бол ?", () => {
    expect(initials("  ")).toBe("?");
    expect(initials("123")).toBe("?");
  });
});

describe("avatarColors", () => {
  it("нэг нэрт үргэлж ижил өнгө", () => {
    expect(avatarColors("hatan-salon")).toEqual(avatarColors("hatan-salon"));
    expect(avatarColors("a").bg).toMatch(/^#[0-9a-f]{6}$/);
  });
});
