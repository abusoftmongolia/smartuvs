/**
 * Долоо хоногийн ажлын цаг — бүртгэл ба тохиргооны формд ашиглах энгийн хэлбэр.
 * Санд (schedules) өдөр бүр 1–2 интервал болж хадгалагдана (завсарлагаар хуваагдана).
 */

export type DayHours = {
  weekday: number; // 0 = Ням ... 6 = Бямба
  open: boolean;
  start: number; // өдрийн минут
  end: number;
  /** Завсарлага (заавал биш) */
  breakStart: number | null;
  breakEnd: number | null;
};

/** Даваагаас эхэлсэн дараалал (Монголд ердийн) */
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;

export function defaultWeekHours(): DayHours[] {
  return WEEK_ORDER.map((weekday) => ({
    weekday,
    open: weekday !== 0,
    start: weekday === 6 ? 600 : 540,
    end: weekday === 6 ? 1020 : 1140,
    breakStart: weekday === 6 ? null : 780,
    breakEnd: weekday === 6 ? null : 840,
  }));
}

/** Алдаатай бол хэрэглэгчид харуулах тайлбар, зөв бол null */
export function weekHoursProblem(week: DayHours[]): string | null {
  if (!week.some((d) => d.open)) return "Ядаж нэг өдөр ажиллах ёстой";
  for (const d of week) {
    if (!d.open) continue;
    if (!(d.start >= 0 && d.end <= 1440 && d.end > d.start)) return "Ажлын цагийн эхлэл дуусахаасаа өмнө байх ёстой";
    if ((d.breakStart == null) !== (d.breakEnd == null)) return "Завсарлагын эхлэл, төгсгөлийг хоёуланг нь бөглөнө үү";
    if (d.breakStart != null && d.breakEnd != null) {
      if (!(d.breakStart > d.start && d.breakEnd < d.end && d.breakEnd > d.breakStart)) {
        return "Завсарлага ажлын цагийн дотор байх ёстой";
      }
    }
  }
  return null;
}

/** Форм → schedules мөрүүд */
export function weekHoursToWindows(week: DayHours[]): { weekday: number; startMin: number; endMin: number }[] {
  const out: { weekday: number; startMin: number; endMin: number }[] = [];
  for (const d of week) {
    if (!d.open) continue;
    if (d.breakStart != null && d.breakEnd != null) {
      out.push({ weekday: d.weekday, startMin: d.start, endMin: d.breakStart });
      out.push({ weekday: d.weekday, startMin: d.breakEnd, endMin: d.end });
    } else {
      out.push({ weekday: d.weekday, startMin: d.start, endMin: d.end });
    }
  }
  return out;
}

/**
 * schedules мөрүүд → форм. Өдөрт 2-оос олон интервал байвал эхний ба сүүлчийнхийг авна
 * (эхлэл = хамгийн эрт, төгсгөл = хамгийн орой, эхний цоорхой = завсарлага).
 */
export function windowsToWeekHours(rows: { weekday: number; startMin: number; endMin: number }[]): DayHours[] {
  return WEEK_ORDER.map((weekday) => {
    const w = rows.filter((r) => r.weekday === weekday).sort((a, b) => a.startMin - b.startMin);
    if (w.length === 0) return { weekday, open: false, start: 540, end: 1080, breakStart: null, breakEnd: null };
    const gap = w.length >= 2 ? { s: w[0].endMin, e: w[1].startMin } : null;
    return {
      weekday,
      open: true,
      start: w[0].startMin,
      end: w[w.length - 1].endMin,
      breakStart: gap ? gap.s : null,
      breakEnd: gap ? gap.e : null,
    };
  });
}

/** "09:30" → 570; буруу бол null */
export function parseHm(s: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(s.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 24 || min > 59 || (h === 24 && min > 0)) return null;
  return h * 60 + min;
}
