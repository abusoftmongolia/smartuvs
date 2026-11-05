/** Байгууллагын лого: файлын төрөл шалгах, логогүй үед нэрийн үсгээр дүрс. Цэвэр функц (tests/logo.test.ts). */

export const LOGO_MAX_BYTES = 300 * 1024;

/** Файлын эхний байтаар төрлийг тодорхойлно (өргөтгөл, браузерийн хэлснийг итгэхгүй) */
export function detectImageMime(b: Uint8Array): "image/png" | "image/jpeg" | "image/webp" | null {
  if (b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "image/png";
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (
    b.length >= 12 &&
    b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && // RIFF
    b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50 // WEBP
  ) return "image/webp";
  return null; // SVG зэргийг санаатайгаар хүлээж авахгүй (script агуулж болно)
}

/** "Хатан Салон" → "ХС", "Увс Авто Угаалга" → "УА", "Тест№1" → "ТЕ" */
export function initials(name: string): string {
  const words = name.trim().split(/[\s\-_.]+/).filter((w) => /\p{L}/u.test(w));
  if (words.length === 0) return "?";
  if (words.length === 1) return Array.from(words[0].replace(/[^\p{L}]/gu, "")).slice(0, 2).join("").toUpperCase();
  return (Array.from(words[0])[0] + Array.from(words[1])[0]).toUpperCase();
}

/** Брэндэд нийцсэн, 4.5:1-ээс дээш ялгаралтай өнгөний хослолууд */
const PALETTE: { bg: string; fg: string }[] = [
  { bg: "#111111", fg: "#f5a800" },
  { bg: "#f5a800", fg: "#111111" },
  { bg: "#1f3a5f", fg: "#ffffff" },
  { bg: "#2f5d50", fg: "#ffffff" },
  { bg: "#6b2d5c", fg: "#ffffff" },
  { bg: "#8a5a00", fg: "#ffffff" },
];

/** Нэрээс тогтвортой өнгө (нэг байгууллага үргэлж ижил өнгөтэй) */
export function avatarColors(seed: string): { bg: string; fg: string } {
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.codePointAt(0)!) >>> 0;
  return PALETTE[h % PALETTE.length];
}
