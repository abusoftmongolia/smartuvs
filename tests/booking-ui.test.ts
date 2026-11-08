import { describe, expect, it } from "vitest";
import {
  bookingDays,
  approvalWaitText,
  confirmedNoteText,
  cancelPolicyText,
  countdownAnnouncement,
  formatCountdown,
  joinParts,
  showVerifyHelp,
} from "@/lib/booking-ui";

describe("bookingDays", () => {
  it("14 өдрөөс хэтрэхгүй, maxAdvanceDays-аар хязгаарлана", () => {
    expect(bookingDays("2026-11-06", 60)).toHaveLength(14);
    expect(bookingDays("2026-11-06", 3)).toHaveLength(4); // өнөөдөр + 3 хоног
    expect(bookingDays("2026-11-06", 0)).toHaveLength(1);
  });
  it("дэлгэц уншигчид монгол огноо, Өнөөдөр/Маргааш", () => {
    const d = bookingDays("2026-11-06", 7);
    expect(d[0]).toEqual({ date: "2026-11-06", wd: "Ба", num: "6", sub: "Өнөөдөр", label: "2026.11.06, Баасан, Өнөөдөр" });
    expect(d[1].label).toBe("2026.11.07, Бямба, Маргааш");
    expect(d[2].label).toBe("2026.11.08, Ням");
    expect(d[2].label).not.toMatch(/\d{4}-\d{2}-\d{2}/);
  });
  it("сарын төгсгөлийг давна", () => {
    expect(bookingDays("2026-11-30", 2).map((x) => x.date)).toEqual(["2026-11-30", "2026-12-01", "2026-12-02"]);
  });
});

describe("countdown", () => {
  it("формат", () => {
    expect(formatCountdown(300)).toBe("5:00");
    expect(formatCountdown(65)).toBe("1:05");
    expect(formatCountdown(-3)).toBe("0:00");
  });
  it("зөвхөн 1 минут үлдсэн ба дууссан үед зарлана", () => {
    expect(countdownAnnouncement(299)).toBe("");
    expect(countdownAnnouncement(61)).toBe("");
    expect(countdownAnnouncement(60)).toBe("1 минут үлдлээ");
    expect(countdownAnnouncement(1)).toBe("1 минут үлдлээ");
    expect(countdownAnnouncement(0)).toBe("Баталгаажуулах хугацаа дууслаа");
  });
  it("45 секундын дараа туслах зөвлөмж", () => {
    expect(showVerifyHelp(0, 44_999)).toBe(false);
    expect(showVerifyHelp(0, 45_000)).toBe(true);
  });
});

describe("бусад", () => {
  it("цуцлах бодлого нэг мөрөөр", () => {
    expect(cancelPolicyText(2)).toBe("Эхлэхээс 2 цагийн өмнө хүртэл SMS-ийн холбоосоор шилжүүлж, цуцалж болно.");
    expect(cancelPolicyText(0)).toContain("хүссэн үедээ");
    // SMS-гүй горимд "SMS" гэж амлахгүй
    expect(cancelPolicyText(2, false)).not.toContain("SMS");
    expect(cancelPolicyText(0, false)).toBe("Захиалгын холбоосоор хүссэн үедээ шилжүүлж, цуцалж болно.");
  });
  it("хоосон хэсэггүй, илүү '·' үгүй", () => {
    expect(joinParts(["Үс засалт", null, ""])).toBe("Үс засалт");
    expect(joinParts(["Үс засалт", "Сараа"])).toBe("Үс засалт · Сараа");
    expect(joinParts([])).toBe("");
  });
  it("батлах хүлээх бичвэр preset-ийн нэр томьёогоор", () => {
    expect(approvalWaitText("staff", "Үсчин")).toBe("Үсчин батлахад SMS ирнэ.");
    expect(approvalWaitText("resource", "Бокс")).toBe("Байгууллага батлахад SMS ирнэ.");
    expect(approvalWaitText("staff", "Үсчин", false)).not.toContain("SMS");
    expect(confirmedNoteText(false)).not.toContain("SMS");
  });
});
