import { describe, expect, it } from "vitest";
import { smsText } from "@/lib/sms";
import { INDUSTRY_IDS, INDUSTRY_PRESETS } from "@/lib/presets";

describe("smsText", () => {
  it("баталгаажсан SMS-д код орно", () => {
    expect(smsText.confirmed({ tenant: "Хатан", day: "Мя 11/10", time: "10:00", link: "L", code: "X4K9M2" })).toContain("Код: X4K9M2");
  });
  it("код байхгүй бол хуучин хэлбэрээр", () => {
    expect(smsText.pending({ tenant: "Хатан", day: "Мя", time: "10:00" })).not.toContain("Код");
  });
  it("байгууллагын мэдэгдэлд үйлчлүүлэгчийн утас орохгүй, батлах хүлээж буйг заана", () => {
    const t = smsText.newBooking({ customer: "Бат", service: "Үс засалт", day: "Мя 11/10", time: "10:00", code: "X4K9M2", pending: true });
    expect(t).toContain("батлах хүлээж буй");
    expect(t).toContain("X4K9M2");
    expect(t).not.toMatch(/\d{8}/);
  });
});

describe("салбарын preset", () => {
  it("салбар бүрт preset байгаа, id таарна", () => {
    for (const id of INDUSTRY_IDS) expect(INDUSTRY_PRESETS[id].id).toBe(id);
  });
  it("'Бусад' хамгийн сүүлд", () => expect(INDUSTRY_IDS.at(-1)).toBe("other"));
});
