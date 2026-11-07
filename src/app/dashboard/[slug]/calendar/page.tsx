/**
 * Календарь — өдрийн захиалга (ажилтан/боксоор баганалсан).
 * /dashboard/<slug>/calendar?date=YYYY-MM-DD  ·  ?code=X4K9M2 — кодоор олж шууд нээнэ
 */
import {
  getBookingByCode,
  listBookingsInRange,
  listOwners,
  listPendingBookings,
  listSchedulesForWeekday,
  listServices,
} from "@/db/tenant";
import { formatBookingCode, normalizeBookingCode } from "@/lib/booking-code";
import { addDays, addMonths, formatDayMn, localToUtc, todayIn, utcToLocalMinute, weekdayOf } from "@/lib/time";
import Link from "next/link";
import { MonthView } from "./MonthView";
import { requireMember } from "@/server/auth";
import { PageBody, PageHeader } from "../../PageHeader";
import { toBoardBooking } from "../board";
import { DayBoard } from "../DayBoard";
import { CodeSearch } from "../CodeSearch";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ date?: string; code?: string; view?: string; month?: string }> };

export default async function CalendarPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { tenant } = await requireMember(slug);
  const tz = tenant.timezone;
  const today = todayIn(tz);
  const sp = await searchParams;
  const codeQuery = sp.code?.slice(0, 20).trim() ?? "";
  const code = codeQuery ? normalizeBookingCode(codeQuery) : null;
  const found = code ? await getBookingByCode(tenant.id, code) : null;
  const q = found ? todayIn(tz, found.startsAt) : sp.date;
  const date = q && /^\d{4}-\d{2}-\d{2}$/.test(q) ? q : today;

  const base = `/dashboard/${slug}/calendar`;
  const subtitle = `Захиалга ${tenant.settings.terminology.staff.toLowerCase()} тус бүрээр`;

  // ── Сарын хүснэгт ──
  if (sp.view === "month" && !found) {
    const month = sp.month && /^\d{4}-(0[1-9]|1[0-2])$/.test(sp.month) ? sp.month : (sp.date ?? today).slice(0, 7);
    const rows = await listBookingsInRange(tenant.id, localToUtc(`${month}-01`, 0, tz), localToUtc(`${addMonths(month, 1)}-01`, 0, tz));
    return (
      <>
        <PageHeader title="Календарь" subtitle={subtitle}>
          <ViewToggle base={base} view="month" date={date} month={month} />
          <CodeSearch action={base} defaultValue="" />
        </PageHeader>
        <PageBody wide>
          <MonthView base={base} month={month} today={today}
            items={rows.map((b) => ({ id: b.id, date: todayIn(tz, b.startsAt), startMin: utcToLocalMinute(b.startsAt, tz), name: b.customerName, status: b.status }))} />
        </PageBody>
      </>
    );
  }

  const kind = tenant.bookingMode === "resource" ? "resource" : "staff";
  const [owners, schedules, dayBookings, pending, services] = await Promise.all([
    listOwners(tenant.id, kind),
    listSchedulesForWeekday(tenant.id, weekdayOf(date)),
    listBookingsInRange(tenant.id, localToUtc(date, 0, tz), localToUtc(addDays(date, 1), 0, tz)),
    listPendingBookings(tenant.id),
    listServices(tenant.id),
  ]);
  const toDto = (b: Parameters<typeof toBoardBooking>[1]) => toBoardBooking(tenant, b);

  // Календарийн цагийн хүрээ: ажлын цаг + захиалгуудыг багтаана
  const ownerSchedules = schedules.filter((s) => (kind === "resource" ? s.resourceId : s.staffId));
  const items = dayBookings.map(toDto);
  const starts = [...ownerSchedules.map((s) => s.startMin), ...items.map((b) => b.startMin)];
  const ends = [...ownerSchedules.map((s) => s.endMin), ...items.map((b) => b.endMin)];
  const fromMin = starts.length ? Math.floor(Math.min(...starts) / 60) * 60 : 9 * 60;
  const toMin = ends.length ? Math.min(1440, Math.ceil(Math.max(...ends) / 60) * 60) : 18 * 60;

  return (
    <>
      <PageHeader title="Календарь" subtitle={subtitle}>
        <ViewToggle base={base} view="day" date={date} month={date.slice(0, 7)} />
        <CodeSearch action={base} defaultValue={codeQuery} />
      </PageHeader>
      <PageBody wide>
        {codeQuery && !found && (
          <p role="alert" className="rounded-xl border border-line bg-white p-4 text-sm">
            <b>{code ? formatBookingCode(code) : codeQuery}</b> кодтой захиалга олдсонгүй. Код 6 тэмдэгттэй (жишээ нь X4K9M2).
          </p>
        )}
        <DayBoard
          key={found?.id ?? "board"} // өөр код хайхад диалог дахин нээгдэнэ
          view="calendar"
          slug={tenant.slug}
          date={date}
          today={today}
          dayLabel={formatDayMn(date)}
          ownerTerm={tenant.settings.terminology.staff}
          bookingMode={tenant.bookingMode}
          owners={owners}
          workHours={ownerSchedules.map((s) => ({ ownerId: (kind === "resource" ? s.resourceId : s.staffId)!, start: s.startMin, end: s.endMin }))}
          fromMin={fromMin}
          toMin={Math.max(toMin, fromMin + 60)}
          bookings={items}
          pending={pending.map(toDto)}
          services={services.map((s) => ({ id: s.id, name: s.name, durationMin: s.durationMin }))}
          initialOpen={found ? toDto(found) : null}
        />
      </PageBody>
    </>
  );
}

/** Өдөр / Сар сонголт */
function ViewToggle({ base, view, date, month }: { base: string; view: "day" | "month"; date: string; month: string }) {
  const cls = (on: boolean) => `inline-flex min-h-11 items-center rounded-md px-3.5 text-sm ${on ? "bg-white font-medium shadow-[0_1px_2px_rgba(0,0,0,0.08)]" : "text-ink/70 hover:text-ink"}`;
  return (
    <div role="group" aria-label="Харагдац" className="flex rounded-lg bg-[#f0f0f0] p-1">
      <Link href={`${base}?date=${view === "month" && date.slice(0, 7) !== month ? `${month}-01` : date}`} aria-current={view === "day" ? "page" : undefined} className={cls(view === "day")}>Өдөр</Link>
      <Link href={`${base}?view=month&month=${month}`} aria-current={view === "month" ? "page" : undefined} className={cls(view === "month")}>Сар</Link>
    </div>
  );
}
