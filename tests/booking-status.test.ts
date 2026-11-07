import { describe, expect, it } from "vitest";
import { BOOKING_STATUS, BOOKING_STATUSES, isBookingStatus, statusLabel } from "@/lib/booking-status";
import { schema } from "@/db";

describe("booking-status", () => {
  it("DB-ийн enum-тай яг таарна", () => {
    expect([...BOOKING_STATUSES].sort()).toEqual([...schema.bookingStatusEnum.enumValues].sort());
    for (const s of BOOKING_STATUSES) expect(BOOKING_STATUS[s].label).toBeTruthy();
  });
  it("prototype түлхүүрийг төлөв гэж хүлээн авахгүй", () => {
    for (const bad of ["constructor", "toString", "__proto__", "hasOwnProperty", "", null, 1]) expect(isBookingStatus(bad)).toBe(false);
    expect(isBookingStatus("no_show")).toBe(true);
  });
  it("statusLabel: үл мэдэгдэхийг тэр чигээр нь", () => {
    expect(statusLabel("pending")).toBe("Батлах хүлээж буй");
    expect(statusLabel("weird")).toBe("weird");
  });
});
