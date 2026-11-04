/**
 * Цагийн бүсийн туслах функцууд. Сангийн бүх цаг UTC; харуулахдаа tenant.timezone ашиглана.
 * Монголд зуны цаг (DST) байхгүй ч Intl ашиглан ерөнхий байдлаар тооцно.
 */

/** Тухайн мөчид цагийн бүсийн UTC-ээс зөрөх минут. Asia/Hovd → +420, Asia/Ulaanbaatar → +480 */
export function tzOffsetMinutes(timeZone: string, at: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(at);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return Math.round((asUtc - at.getTime()) / 60000);
}

/** "2026-11-06" + 810 минут (13:30) тухайн бүсэд → UTC Date */
export function localToUtc(date: string, minuteOfDay: number, timeZone: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  const naive = Date.UTC(y, m - 1, d, 0, 0) + minuteOfDay * 60000;
  // Эхлээд ойролцоо offset-оор хөрвүүлээд, тухайн мөчийн offset-оор нэг удаа засна
  const guess = new Date(naive - tzOffsetMinutes(timeZone, new Date(naive)) * 60000);
  return new Date(naive - tzOffsetMinutes(timeZone, guess) * 60000);
}

/** UTC Date → тухайн бүсийн өдрийн минут (0–1439) */
export function utcToLocalMinute(at: Date, timeZone: string): number {
  const local = at.getTime() + tzOffsetMinutes(timeZone, at) * 60000;
  const d = new Date(local);
  return d.getUTCHours() * 60 + d.getUTCMinutes();
}

/** "2026-11-06" өдрийн гариг: 0 = Ням ... 6 = Бямба (бүсээс хамаарахгүй, календарийн өдөр) */
export function weekdayOf(date: string): number {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/** Тухайн бүсийн "өнөөдөр" — "YYYY-MM-DD" */
export function todayIn(timeZone: string, now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

export function addDays(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

export function formatHm(minuteOfDay: number): string {
  const h = Math.floor(minuteOfDay / 60);
  const m = minuteOfDay % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

const WEEKDAYS_MN = ["Ням", "Даваа", "Мягмар", "Лхагва", "Пүрэв", "Баасан", "Бямба"];
const WEEKDAYS_MN_SHORT = ["Ня", "Да", "Мя", "Лх", "Пү", "Ба", "Бя"];

export function weekdayName(date: string, short = false): string {
  return (short ? WEEKDAYS_MN_SHORT : WEEKDAYS_MN)[weekdayOf(date)];
}

/** "Баасан, 11/06" */
export function formatDayMn(date: string): string {
  return `${weekdayName(date)}, ${date.slice(5, 7)}/${date.slice(8, 10)}`;
}

/** Үнэ: 25000 → "₮25,000" */
export function formatPrice(price: number | null, from = false): string | null {
  if (price == null) return null;
  return `₮${price.toLocaleString("en-US")}${from ? "-аас" : ""}`;
}
