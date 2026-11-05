import { describe, expect, it } from "vitest";
import { buildIcs, escapeText, foldLine } from "@/lib/ics";

describe("buildIcs", () => {
  const ics = buildIcs({
    uid: "abc@tsag.smartuvs.mn",
    start: new Date("2026-11-12T03:30:00Z"),
    end: new Date("2026-11-12T04:00:00Z"),
    title: "Хатан Салон: Эрэгтэй үс засалт",
    location: "Улаангом, 2-р баг",
    url: "https://tsag.smartuvs.mn/manage/x",
    alarmMinutes: [60],
    now: new Date("2026-11-05T00:00:00Z"),
  });

  it("UTC цагтай, CRLF-ээр төгсдөг", () => {
    expect(ics).toContain("DTSTART:20261112T033000Z\r\n");
    expect(ics).toContain("DTEND:20261112T040000Z\r\n");
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
  });

  it("сануулгатай", () => {
    expect(ics).toContain("TRIGGER:-PT60M");
  });

  it("таслалыг escape хийнэ", () => {
    expect(ics).toContain("LOCATION:Улаангом\\, 2-р баг");
  });

  it("мөр бүр 75 октетоос хэтрэхгүй", () => {
    const enc = new TextEncoder();
    for (const line of ics.split("\r\n")) expect(enc.encode(line).length).toBeLessThanOrEqual(75);
  });
});

describe("helpers", () => {
  it("escapeText", () => {
    expect(escapeText("a;b,c\\d\ne")).toBe("a\\;b\\,c\\\\d\\ne");
  });
  it("foldLine кирилл тэмдэгтийг таслахгүй", () => {
    const folded = foldLine("SUMMARY:" + "Ө".repeat(60));
    const unfolded = folded.replace(/\r\n /g, "");
    expect(unfolded).toBe("SUMMARY:" + "Ө".repeat(60));
  });
});
