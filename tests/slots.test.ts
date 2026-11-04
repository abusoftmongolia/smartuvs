import { describe, expect, it } from "vitest";
import { computeSlots, subtract, type OwnerDay, type SlotQuery } from "@/lib/slots";
import { localToUtc } from "@/lib/time";

const TZ = "Asia/Hovd"; // UTC+7
const DATE = "2026-11-06"; // Баасан

const q = (over: Partial<SlotQuery> = {}): SlotQuery => ({
  date: DATE,
  timeZone: TZ,
  durationMin: 30,
  bufferMin: 0,
  stepMin: 30,
  minLeadMin: 60,
  now: new Date("2026-11-01T00:00:00Z"), // өмнөх өдрүүдэд — lead хязгаар нөлөөлөхгүй
  ...over,
});

const at = (hm: string) => {
  const [h, m] = hm.split(":").map(Number);
  return localToUtc(DATE, h * 60 + m, TZ);
};

describe("subtract", () => {
  it("интервалаас дунд хэсгийг хасна", () => {
    expect(subtract([{ start: 540, end: 720 }], [{ start: 600, end: 630 }])).toEqual([
      { start: 540, end: 600 },
      { start: 630, end: 720 },
    ]);
  });
  it("бүрэн давхцвал хоосон", () => {
    expect(subtract([{ start: 540, end: 600 }], [{ start: 500, end: 700 }])).toEqual([]);
  });
});

describe("localToUtc", () => {
  it("Asia/Hovd 13:30 = UTC 06:30", () => {
    expect(at("13:30").toISOString()).toBe("2026-11-06T06:30:00.000Z");
  });
  it("Asia/Ulaanbaatar 13:30 = UTC 05:30", () => {
    expect(localToUtc(DATE, 810, "Asia/Ulaanbaatar").toISOString()).toBe("2026-11-06T05:30:00.000Z");
  });
});

describe("computeSlots", () => {
  const owner = (busy: OwnerDay["busy"] = []): OwnerDay => ({
    ownerId: "a",
    windows: [{ start: 540, end: 720 }], // 09:00–12:00
    busy,
  });

  it("ажлын цагийг алхмаар хуваана, сүүлийн цаг дуусах цагт багтана", () => {
    const labels = computeSlots([owner()], q()).map((s) => s.label);
    expect(labels).toEqual(["09:00", "09:30", "10:00", "10:30", "11:00", "11:30"]);
  });

  it("захиалгатай цагийг хасна", () => {
    const labels = computeSlots([owner([{ startsAt: at("10:00"), endsAt: at("10:45") }])], q()).map((s) => s.label);
    expect(labels).toEqual(["09:00", "09:30", "11:00", "11:30"]);
  });

  it("buffer-тай үйлчилгээ богино зайд багтахгүй", () => {
    const labels = computeSlots([owner()], q({ durationMin: 45, bufferMin: 15, stepMin: 15 })).map((s) => s.label);
    expect(labels.at(-1)).toBe("11:00"); // 11:00 + 60 = 12:00
  });

  it("өнөөдөр бол одооноос minLeadMin-ээс өмнөх цагийг санал болгохгүй", () => {
    const now = at("09:40"); // + 60 мин = 10:40
    const labels = computeSlots([owner()], q({ now })).map((s) => s.label);
    expect(labels).toEqual(["11:00", "11:30"]);
  });

  it("'Хэн ч болно' — хэд хэдэн ажилтны сул цагийг нэгтгэнэ", () => {
    const a = owner([{ startsAt: at("09:00"), endsAt: at("12:00") }]); // а бүтэн өдөр завгүй
    const b: OwnerDay = { ownerId: "b", windows: [{ start: 540, end: 600 }], busy: [] };
    const slots = computeSlots([a, b], q());
    expect(slots.map((s) => [s.label, s.ownerIds])).toEqual([
      ["09:00", ["b"]],
      ["09:30", ["b"]],
    ]);
  });

  it("endsAt = эхлэх + үргэлжлэх + buffer", () => {
    const [s] = computeSlots([owner()], q({ durationMin: 30, bufferMin: 5, stepMin: 15 }));
    expect(s.endsAt.getTime() - s.startsAt.getTime()).toBe(35 * 60000);
  });
});
