/** Админы харагдах цаг — Улаанбаатарын цагаар */
// "mn-MN" locale сарыг Ром тоогоор (XI) гаргадаг тул хэсгүүдээр нь угсарна: "2026.11.05 17:46" (Он.Сар.Өдөр)
const dt = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Ulaanbaatar", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
const d = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ulaanbaatar", year: "numeric", month: "2-digit", day: "2-digit" });

export function fmtDateTime(x: Date): string {
  const p = Object.fromEntries(dt.formatToParts(x).map((q) => [q.type, q.value]));
  return `${p.year}.${p.month}.${p.day} ${p.hour}:${p.minute}`;
}
export const fmtDate = (x: Date) => d.format(x).replaceAll("-", ".");
export const maskPhone = (p: string | null) => (p ? `${p.slice(0, 2)}****${p.slice(-2)}` : "—");

/** "5 мин", "3 цаг", "2 өдөр" өмнө */
export function ago(x: Date, now = Date.now()): string {
  const m = Math.max(0, Math.round((now - x.getTime()) / 60000));
  if (m < 1) return "Дөнгөж сая";
  if (m < 60) return `${m} мин өмнө`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} цагийн өмнө`;
  const days = Math.round(h / 24);
  return days < 30 ? `${days} өдрийн өмнө` : fmtDate(x);
}

/** tsag (байгууллагын хэсэг)-ийн бүтэн хаяг — админ хост дээрээс тийш холбоно */
export const TSAG = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://tsag.smartuvs.mn").replace(/\/$/, "");
