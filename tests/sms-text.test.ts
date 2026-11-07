import { describe, expect, it } from "vitest";
import { smsText } from "@/lib/sms";
import { INDUSTRY_IDS, INDUSTRY_PRESETS } from "@/lib/presets";

describe("smsText", () => {
  it("баталгаажсан SMS-д код орно", () => {
    expect(smsText.confirmed({ tenant: "Хатан", day: "Мя 11/10", time: "10:00", link: "L", code: "X4K9M2" })).toContain("Код: X4K9M2");
  });
  it("код байхгүй бол хуучин хэлбэрээр", () => {
    expect(smsText.pending({ tenant: "Хатан", day: "Мя", time: "10:00", link: "L" })).not.toContain("Код");
  });
  it("батлах хүлээж буй SMS-д өөрчлөх холбоос орно", () => {
    expect(smsText.pending({ tenant: "Хатан", day: "Мя", time: "10:00", link: "tsag.smartuvs.mn/manage/abc" })).toContain("tsag.smartuvs.mn/manage/abc");
  });
  it("цуцлалт, шилжүүлэлтийн байгууллагын SMS: код, хуучин→шинэ цаг, утасгүй", () => {
    const c = smsText.customerCancelled({ customer: "Бат", service: "Үс засалт", day: "2026.11.10, Мягмар", time: "10:00", code: "X4K9M2" });
    expect(c).toContain("цуцаллаа");
    expect(c).toContain("X4K9M2");
    expect(c).not.toMatch(/\d{8}/);
    const r = smsText.customerRescheduled({ customer: "Бат", service: "Үс засалт", from: "2026.11.10, Мягмар 10:00", day: "2026.11.11, Лхагва", time: "12:00", code: "X4K9M2", pending: true });
    expect(r).toContain("2026.11.10, Мягмар 10:00 → 2026.11.11, Лхагва 12:00");
    expect(r).toContain("батлах хүлээж буй");
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

import { addMonths, daysOfMonth, formatDayMn, formatMonthMn } from "@/lib/time";

describe("огноо — Он.Сар.Өдөр", () => {
  it("formatDayMn", () => expect(formatDayMn("2026-11-06")).toBe("2026.11.06, Баасан"));
  it("formatMonthMn", () => expect(formatMonthMn("2026-01")).toBe("2026 оны 1-р сар"));
  it("сарын өдрүүд (өндөр жил)", () => {
    expect(daysOfMonth("2028-02")).toHaveLength(29);
    expect(daysOfMonth("2026-11").at(-1)).toBe("2026-11-30");
  });
  it("сар нэмэх, оны заагаар", () => {
    expect(addMonths("2026-12", 1)).toBe("2027-01");
    expect(addMonths("2026-01", -1)).toBe("2025-12");
  });
});
