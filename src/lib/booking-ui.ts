/**
 * Захиалгын урсгалын (захиалах, /manage) харагдацын цэвэр логик — client, server хоёуланд.
 * tests/booking-ui.test.ts
 */
import { addDays, formatDayMn, weekdayName } from "./time";

export type DayChip = {
  date: string;
  /** "Ба" */
  wd: string;
  /** "6" */
  num: string;
  /** "Өнөөдөр" | "Маргааш" | "" */
  sub: string;
  /** Дэлгэц уншигчид: "2026.11.06, Баасан, Өнөөдөр" */
  label: string;
};

/** Захиалгын хуудсанд харуулах дээд өдөр */
export const MAX_DAY_CHIPS = 14;

/**
 * Өнөөдрөөс эхлэх өдрийн товчнууд. `maxAdvanceDays` (өнөөдрөөс хэд хоногийн дараах хүртэл
 * захиалж болох) -оос хэтрэхгүй: сервер тэр өдрүүдэд сул цаг өгөхгүй тул хоосон өдөр харуулахгүй.
 */
export function bookingDays(today: string, maxAdvanceDays: number, cap = MAX_DAY_CHIPS): DayChip[] {
  const n = Math.max(1, Math.min(cap, Math.floor(maxAdvanceDays) + 1));
  return Array.from({ length: n }, (_, i) => {
    const date = addDays(today, i);
    const sub = i === 0 ? "Өнөөдөр" : i === 1 ? "Маргааш" : "";
    return { date, wd: weekdayName(date, true), num: String(Number(date.slice(8))), sub, label: sub ? `${formatDayMn(date)}, ${sub}` : formatDayMn(date) };
  });
}

/** 125 → "2:05" */
export function formatCountdown(secondsLeft: number): string {
  const s = Math.max(0, Math.floor(secondsLeft));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/**
 * Дэлгэц уншигчид зарлах текст. Секунд бүр биш — зөвхөн 1 минут үлдэх ба дуусах үед
 * өөрчлөгдөнө (aria-live бүс текст өөрчлөгдөх бүрт уншдаг).
 */
export function countdownAnnouncement(secondsLeft: number): string {
  if (secondsLeft <= 0) return "Баталгаажуулах хугацаа дууслаа";
  if (secondsLeft <= 60) return "1 минут үлдлээ";
  return "";
}

/** SMS хүлээж эхэлснээс хойш энэ хугацаа өнгөрвөл туслах зөвлөмж харуулна */
export const VERIFY_HELP_AFTER_MS = 45_000;

export function showVerifyHelp(startedAt: number, now: number): boolean {
  return now - startedAt >= VERIFY_HELP_AFTER_MS;
}

/** Үйлчлүүлэгчид харуулах цуцлах бодлого — нэг мөр */
export function cancelPolicyText(cancellationHours: number): string {
  return cancellationHours > 0
    ? `Эхлэхээс ${cancellationHours} цагийн өмнө хүртэл SMS-ийн холбоосоор шилжүүлж, цуцалж болно.`
    : "SMS-ийн холбоосоор хүссэн үедээ шилжүүлж, цуцалж болно.";
}

/** Амжилтын дэлгэцийн дэд мөр: "Үс засалт · Сараа" — хоосон хэсгийг алгасна */
export function joinParts(parts: (string | null | undefined)[]): string {
  return parts.filter((x): x is string => !!x && !!x.trim()).join(" · ");
}

/** "Үсчин батлахад SMS ирнэ." — салбарын нэр томьёогоор; бокс горимд байгууллага батална */
export function approvalWaitText(bookingMode: "staff" | "resource", staffTerm: string): string {
  return bookingMode === "staff" && staffTerm.trim() ? `${staffTerm} батлахад SMS ирнэ.` : "Байгууллага батлахад SMS ирнэ.";
}
