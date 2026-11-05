import { describe, expect, it } from "vitest";
import { customerChangeBlock, shouldSendReminder } from "@/lib/policy";

const now = new Date("2026-11-10T00:00:00Z");
const inHours = (h: number) => new Date(now.getTime() + h * 3600_000);

describe("customerChangeBlock", () => {
  it("хангалттай хугацаа байвал зөвшөөрнө", () => {
    expect(customerChangeBlock({ status: "confirmed", startsAt: inHours(5), now, cancellationHours: 3 })).toBeNull();
    expect(customerChangeBlock({ status: "pending", startsAt: inHours(3), now, cancellationHours: 3 })).toBeNull();
  });
  it("хэт ойрхон бол too_late", () => {
    expect(customerChangeBlock({ status: "confirmed", startsAt: inHours(2.9), now, cancellationHours: 3 })).toBe("too_late");
  });
  it("цуцлагдсан, ирсэн, дууссан бол status", () => {
    for (const s of ["cancelled", "checked_in", "completed", "no_show"]) {
      expect(customerChangeBlock({ status: s, startsAt: inHours(48), now, cancellationHours: 3 })).toBe("status");
    }
  });
  it("0 цаг бол эхлэх хүртэл болно", () => {
    expect(customerChangeBlock({ status: "confirmed", startsAt: inHours(0.1), now, cancellationHours: 0 })).toBeNull();
  });
});

describe("shouldSendReminder", () => {
  it("идэвхтэй, ирээдүйн захиалгад л илгээнэ", () => {
    expect(shouldSendReminder({ bookingStatus: "confirmed", startsAt: inHours(2), now })).toBe(true);
    expect(shouldSendReminder({ bookingStatus: "cancelled", startsAt: inHours(2), now })).toBe(false);
    expect(shouldSendReminder({ bookingStatus: "confirmed", startsAt: inHours(-1), now })).toBe(false);
  });
});
