/**
 * Байгууллагын тайлан — өдөр/сарын захиалгын тоо, ирээгүй хувь. ЦЭВЭР функц (tests/report.test.ts).
 *
 * Ирээгүй хувь = ирээгүй / (ирсэн + дууссан + ирээгүй). Ирсэн/ирээгүйг тэмдэглээгүй
 * (өнгөрсөн боловч "Баталгаажсан" хэвээр) захиалгыг хуваарьт оруулахгүй — тэдгээрийг
 * "Тэмдэглээгүй" гэж тусад нь тоолж, самбарт сануулна.
 */
import { daysOfMonth, todayIn } from "./time";

export type ReportStatus = "pending" | "confirmed" | "checked_in" | "completed" | "cancelled" | "no_show";

export type ReportRow = {
  startsAt: Date;
  status: ReportStatus;
  serviceName: string;
  /** Ажилтан эсвэл боксын id (bookingMode-оос хамаарна), хуваарилаагүй бол null */
  ownerId: string | null;
};

export type Counts = {
  /** Цуцлагдсанаас бусад бүх захиалга */
  total: number;
  cancelled: number;
  pending: number;
  confirmed: number;
  /** Ирсэн + дууссан */
  attended: number;
  noShow: number;
  /** Өнгөрсөн боловч ирсэн/ирээгүй тэмдэглээгүй (pending, confirmed) */
  unmarked: number;
};

export type DayCount = { date: string; total: number; noShow: number; cancelled: number };
export type GroupCount = { key: string; label: string; total: number; noShow: number };

export type MonthReport = {
  month: string;
  counts: Counts;
  noShowRate: number | null;
  days: DayCount[];
  busiest: DayCount | null;
  byService: GroupCount[];
  byOwner: GroupCount[];
};

const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

/** "?month=2026-11" параметрийг шалгана; буруу бол fallback */
export function parseMonth(input: string | undefined | null, fallback: string): string {
  return input && MONTH_RE.test(input) ? input : fallback;
}

export function emptyCounts(): Counts {
  return { total: 0, cancelled: 0, pending: 0, confirmed: 0, attended: 0, noShow: 0, unmarked: 0 };
}

/** Ирээгүй хувь (0–1), тэмдэглэгдсэн захиалга байхгүй бол null */
export function noShowRate(c: Pick<Counts, "attended" | "noShow">): number | null {
  const marked = c.attended + c.noShow;
  return marked > 0 ? c.noShow / marked : null;
}

/** 0.1234 → "12%", null → "—" */
export function formatPercent(rate: number | null): string {
  return rate == null ? "—" : `${Math.round(rate * 100)}%`;
}

export function countRows(rows: Pick<ReportRow, "startsAt" | "status">[], now: Date): Counts {
  const c = emptyCounts();
  for (const r of rows) {
    if (r.status === "cancelled") {
      c.cancelled++;
      continue;
    }
    c.total++;
    if (r.status === "pending") c.pending++;
    else if (r.status === "confirmed") c.confirmed++;
    else if (r.status === "no_show") c.noShow++;
    else c.attended++;
    if ((r.status === "pending" || r.status === "confirmed") && r.startsAt < now) c.unmarked++;
  }
  return c;
}

function group(rows: ReportRow[], keyOf: (r: ReportRow) => string, labelOf: (key: string) => string): GroupCount[] {
  const m = new Map<string, GroupCount>();
  for (const r of rows) {
    if (r.status === "cancelled") continue;
    const key = keyOf(r);
    const g = m.get(key) ?? { key, label: labelOf(key), total: 0, noShow: 0 };
    g.total++;
    if (r.status === "no_show") g.noShow++;
    m.set(key, g);
  }
  return [...m.values()].sort((a, b) => b.total - a.total || a.label.localeCompare(b.label));
}

/**
 * Сарын тайлан. `rows` нь тухайн сард (байгууллагын цагийн бүсээр) эхлэх захиалгууд
 * (цуцлагдсаныг оруулаад). Сарын гадуурх мөрийг өдрийн хүснэгтэд тоолохгүй.
 */
export function buildMonthReport(
  rows: ReportRow[],
  opts: { month: string; timeZone: string; now: Date; ownerNames?: Record<string, string>; unassignedLabel?: string },
): MonthReport {
  const days = daysOfMonth(opts.month);
  const byDate = new Map<string, DayCount>(days.map((d) => [d, { date: d, total: 0, noShow: 0, cancelled: 0 }]));
  const inMonth: ReportRow[] = [];
  for (const r of rows) {
    const day = byDate.get(todayIn(opts.timeZone, r.startsAt));
    if (!day) continue;
    inMonth.push(r);
    if (r.status === "cancelled") day.cancelled++;
    else {
      day.total++;
      if (r.status === "no_show") day.noShow++;
    }
  }
  const counts = countRows(inMonth, opts.now);
  const dayList = [...byDate.values()];
  const busiest = dayList.reduce<DayCount | null>((best, d) => (d.total > 0 && (!best || d.total > best.total) ? d : best), null);
  const names = opts.ownerNames ?? {};
  const unassigned = opts.unassignedLabel ?? "Хуваарилаагүй";
  return {
    month: opts.month,
    counts,
    noShowRate: noShowRate(counts),
    days: dayList,
    busiest,
    byService: group(inMonth, (r) => r.serviceName, (k) => k),
    byOwner: group(inMonth, (r) => r.ownerId ?? "", (k) => (k ? names[k] ?? "Устгагдсан" : unassigned)),
  };
}
