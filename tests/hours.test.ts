import { describe, expect, it } from "vitest";
import {
  defaultWeekHours,
  parseHm,
  weekHoursProblem,
  weekHoursToWindows,
  windowsToWeekHours,
  type DayHours,
} from "@/lib/hours";

const day = (p: Partial<DayHours>): DayHours => ({
  weekday: 1, open: true, start: 540, end: 1080, breakStart: null, breakEnd: null, ...p,
});

describe("weekHoursToWindows", () => {
  it("завсарлагаар хоёр интервал болгоно", () => {
    expect(weekHoursToWindows([day({ breakStart: 780, breakEnd: 840 })])).toEqual([
      { weekday: 1, startMin: 540, endMin: 780 },
      { weekday: 1, startMin: 840, endMin: 1080 },
    ]);
  });

  it("амралтын өдрийг алгасна", () => {
    expect(weekHoursToWindows([day({ open: false })])).toEqual([]);
  });

  it("буцааж хөрвүүлэхэд ижил гарна", () => {
    const week = defaultWeekHours();
    expect(windowsToWeekHours(weekHoursToWindows(week))).toEqual(
      week.map((d) => (d.open ? d : { ...d, start: 540, end: 1080, breakStart: null, breakEnd: null })),
    );
  });
});

describe("weekHoursProblem", () => {
  it("зөв цагт null", () => {
    expect(weekHoursProblem(defaultWeekHours())).toBeNull();
  });
  it("бүх өдөр хаалттай бол алдаа", () => {
    expect(weekHoursProblem(defaultWeekHours().map((d) => ({ ...d, open: false })))).not.toBeNull();
  });
  it("эхлэл > төгсгөл бол алдаа", () => {
    expect(weekHoursProblem([day({ start: 1100, end: 1000 })])).not.toBeNull();
  });
  it("завсарлага гадна байвал алдаа", () => {
    expect(weekHoursProblem([day({ breakStart: 500, breakEnd: 600 })])).not.toBeNull();
    expect(weekHoursProblem([day({ breakStart: 780, breakEnd: null })])).not.toBeNull();
  });
});

describe("parseHm", () => {
  it("цагийг минут болгоно", () => {
    expect(parseHm("09:30")).toBe(570);
    expect(parseHm("9:05")).toBe(545);
    expect(parseHm("24:00")).toBe(1440);
    expect(parseHm("25:00")).toBeNull();
    expect(parseHm("12:60")).toBeNull();
    expect(parseHm("abc")).toBeNull();
  });
});
