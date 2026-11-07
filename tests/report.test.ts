import { describe, expect, it } from "vitest";
import { buildMonthReport, countRows, formatPercent, noShowRate, parseMonth, type ReportRow } from "@/lib/report";

const TZ = "Asia/Hovd"; // UTC+7
const now = new Date("2026-11-20T05:00:00Z");
const row = (iso: string, status: ReportRow["status"], serviceName = "Үс засалт", ownerId: string | null = "s1"): ReportRow => ({
  startsAt: new Date(iso),
  status,
  serviceName,
  ownerId,
});

describe("parseMonth", () => {
  it("зөв сарыг хүлээн авна, буруу бол fallback", () => {
    expect(parseMonth("2026-02", "2026-11")).toBe("2026-02");
    expect(parseMonth("2026-13", "2026-11")).toBe("2026-11");
    expect(parseMonth("26-1", "2026-11")).toBe("2026-11");
    expect(parseMonth(undefined, "2026-11")).toBe("2026-11");
  });
});

describe("noShowRate", () => {
  it("тэмдэглэгдсэн захиалгаас тооцно", () => {
    expect(noShowRate({ attended: 3, noShow: 1 })).toBe(0.25);
    expect(noShowRate({ attended: 0, noShow: 0 })).toBeNull();
    expect(formatPercent(0.254)).toBe("25%");
    expect(formatPercent(null)).toBe("—");
  });
});

describe("countRows", () => {
  it("цуцлагдсаныг нийтэд оруулахгүй, өнгөрсөн тэмдэглээгүйг тоолно", () => {
    const c = countRows(
      [
        row("2026-11-10T03:00:00Z", "completed"),
        row("2026-11-10T04:00:00Z", "checked_in"),
        row("2026-11-11T03:00:00Z", "no_show"),
        row("2026-11-12T03:00:00Z", "cancelled"),
        row("2026-11-13T03:00:00Z", "confirmed"), // өнгөрсөн, тэмдэглээгүй
        row("2026-11-25T03:00:00Z", "confirmed"), // ирээдүй
        row("2026-11-26T03:00:00Z", "pending"),
      ],
      now,
    );
    expect(c).toEqual({ total: 6, cancelled: 1, pending: 1, confirmed: 2, attended: 2, noShow: 1, unmarked: 1 });
  });
});

describe("buildMonthReport", () => {
  it("өдрөөр байгууллагын цагийн бүсээр хуваана", () => {
    // 2026-11-30T18:00Z = Ховд 12/01 01:00 → 12-р сард, тоологдохгүй
    // 2026-10-31T17:30Z = Ховд 11/01 00:30 → 11/01
    const r = buildMonthReport(
      [row("2026-10-31T17:30:00Z", "completed"), row("2026-11-30T18:00:00Z", "completed"), row("2026-11-01T02:00:00Z", "no_show")],
      { month: "2026-11", timeZone: TZ, now },
    );
    expect(r.days).toHaveLength(30);
    expect(r.days[0]).toEqual({ date: "2026-11-01", total: 2, noShow: 1, cancelled: 0 });
    expect(r.counts.total).toBe(2);
    expect(r.noShowRate).toBe(0.5);
  });

  it("хамгийн их захиалгатай өдөр, үйлчилгээ ба ажилтнаар бүлэглэнэ", () => {
    const r = buildMonthReport(
      [
        row("2026-11-05T03:00:00Z", "completed", "Будаг", "s2"),
        row("2026-11-05T05:00:00Z", "no_show", "Үс засалт", "s1"),
        row("2026-11-05T06:00:00Z", "completed", "Үс засалт", null),
        row("2026-11-06T03:00:00Z", "completed", "Үс засалт", "s1"),
        row("2026-11-06T04:00:00Z", "cancelled", "Будаг", "s2"),
      ],
      { month: "2026-11", timeZone: TZ, now, ownerNames: { s1: "Сараа", s2: "Ганаа" }, unassignedLabel: "Хэн ч болно" },
    );
    expect(r.busiest?.date).toBe("2026-11-05");
    expect(r.byService).toEqual([
      { key: "Үс засалт", label: "Үс засалт", total: 3, noShow: 1 },
      { key: "Будаг", label: "Будаг", total: 1, noShow: 0 },
    ]);
    expect(r.byOwner.map((g) => [g.label, g.total])).toEqual([["Сараа", 2], ["Ганаа", 1], ["Хэн ч болно", 1]]);
    expect(r.days[5].cancelled).toBe(1);
  });

  it("захиалгагүй сард busiest = null, хувь = null", () => {
    const r = buildMonthReport([], { month: "2026-02", timeZone: TZ, now });
    expect(r.days).toHaveLength(28);
    expect(r.busiest).toBeNull();
    expect(r.noShowRate).toBeNull();
  });
});
