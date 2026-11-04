/**
 * Сул цаг тооцоолуур — цэвэр функц, өгөгдлийн сангаас хамааралгүй (tests/slots.test.ts).
 *
 * Алгоритм (ажилтан эсвэл нөөц бүрт, нэг өдөр):
 *  1. Ажлын цаг (schedules) − чөлөө (time_off) = чөлөөт интервал
 *  2. − тухайн өдрийн идэвхтэй захиалгууд (buffer-тай нь, endsAt нь buffer-ийг агуулдаг)
 *  3. Үлдсэн интервалыг `durationMin + bufferMin` урттай, `stepMin` алхмаар хуваана
 *  4. "Хамгийн эрт захиалах" (minLeadMin) хязгаарыг хэрэглэнэ
 *
 * Эцсийн хамгаалалт нь өгөгдлийн сангийн exclusion constraint — энэ функц зөвхөн санал болгоно.
 */
import { formatHm, localToUtc, utcToLocalMinute, todayIn } from "./time";

export type Interval = { start: number; end: number }; // өдрийн минут, [start, end)

export type OwnerDay = {
  ownerId: string;
  /** Тухайн гаригийн ажлын цаг (завсарлагыг тусад нь мөр болгож хуваана) */
  windows: Interval[];
  /** Чөлөө, захиалга — UTC */
  busy: { startsAt: Date; endsAt: Date }[];
};

export type SlotQuery = {
  date: string; // "YYYY-MM-DD" байгууллагын бүсээр
  timeZone: string;
  durationMin: number;
  bufferMin: number;
  stepMin: number;
  minLeadMin: number;
  now: Date;
};

export type Slot = {
  label: string; // "13:30"
  startMin: number;
  startsAt: Date;
  endsAt: Date; // үйлчилгээ + buffer
  ownerIds: string[]; // энэ цагт сул байгаа ажилтан/нөөцүүд
};

/** a − b */
export function subtract(a: Interval[], b: Interval[]): Interval[] {
  let result = a.map((x) => ({ ...x }));
  for (const cut of b) {
    const next: Interval[] = [];
    for (const r of result) {
      if (cut.end <= r.start || cut.start >= r.end) {
        next.push(r);
        continue;
      }
      if (cut.start > r.start) next.push({ start: r.start, end: cut.start });
      if (cut.end < r.end) next.push({ start: cut.end, end: r.end });
    }
    result = next;
  }
  return result.filter((r) => r.end > r.start).sort((x, y) => x.start - y.start);
}

/** UTC хүрээг тухайн өдрийн минутын интервал руу хайчилна (өөр өдөр бол хасагдана) */
function busyToInterval(busy: { startsAt: Date; endsAt: Date }, q: SlotQuery): Interval | null {
  const dayStart = localToUtc(q.date, 0, q.timeZone).getTime();
  const dayEnd = dayStart + 24 * 60 * 60000;
  const s = Math.max(busy.startsAt.getTime(), dayStart);
  const e = Math.min(busy.endsAt.getTime(), dayEnd);
  if (e <= s) return null;
  const startMin = s === dayStart ? 0 : utcToLocalMinute(new Date(s), q.timeZone);
  const endMin = e === dayEnd ? 1440 : utcToLocalMinute(new Date(e), q.timeZone);
  return { start: startMin, end: endMin === 0 ? 1440 : endMin };
}

export function freeIntervals(owner: OwnerDay, q: SlotQuery): Interval[] {
  const busy = owner.busy.map((b) => busyToInterval(b, q)).filter((x): x is Interval => x !== null);
  return subtract(owner.windows, busy);
}

/** Нэг ажилтан/нөөцийн сул эхлэх минутууд */
export function ownerStartMinutes(owner: OwnerDay, q: SlotQuery): number[] {
  const need = q.durationMin + q.bufferMin;
  const isToday = todayIn(q.timeZone, q.now) === q.date;
  const earliest = isToday ? utcToLocalMinute(q.now, q.timeZone) + q.minLeadMin : -1;
  const starts: number[] = [];
  for (const iv of freeIntervals(owner, q)) {
    // алхамд тааруулж эхлүүлнэ: 09:00, 09:15 ...
    let t = Math.ceil(iv.start / q.stepMin) * q.stepMin;
    for (; t + need <= iv.end; t += q.stepMin) {
      if (t >= earliest) starts.push(t);
    }
  }
  return starts;
}

/**
 * Олон ажилтны сул цагийг нэгтгэнэ ("Хэн ч болно" сонголтод).
 * Нэг ажилтан сонгосон бол owners-д ганц элемент дамжуулна.
 */
export function computeSlots(owners: OwnerDay[], q: SlotQuery): Slot[] {
  const byMinute = new Map<number, string[]>();
  for (const o of owners) {
    for (const m of ownerStartMinutes(o, q)) {
      const list = byMinute.get(m) ?? [];
      list.push(o.ownerId);
      byMinute.set(m, list);
    }
  }
  return [...byMinute.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([startMin, ownerIds]) => {
      const startsAt = localToUtc(q.date, startMin, q.timeZone);
      return {
        label: formatHm(startMin),
        startMin,
        startsAt,
        endsAt: new Date(startsAt.getTime() + (q.durationMin + q.bufferMin) * 60000),
        ownerIds,
      };
    });
}

/** Өглөө / Өдөр / Орой гэж бүлэглэнэ (UI-д) */
export function groupSlots(slots: Slot[]) {
  return [
    { label: "Өглөө", slots: slots.filter((s) => s.startMin < 12 * 60) },
    { label: "Өдөр", slots: slots.filter((s) => s.startMin >= 12 * 60 && s.startMin < 17 * 60) },
    { label: "Орой", slots: slots.filter((s) => s.startMin >= 17 * 60) },
  ].filter((g) => g.slots.length > 0);
}
