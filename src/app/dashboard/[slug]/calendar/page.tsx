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
import { addDays, formatDayMn, localToUtc, todayIn, weekdayOf } from "@/lib/time";
import { requireMember } from "@/server/auth";
import { PageBody, PageHeader } from "../../PageHeader";
import { toBoardBooking } from "../board";
import { DayBoard } from "../DayBoard";
import { CodeSearch } from "../CodeSearch";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ date?: string; code?: string }> };

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
      <PageHeader title="Календарь" subtitle={`Өдрийн захиалга ${tenant.settings.terminology.staff.toLowerCase()} тус бүрээр`}>
        <CodeSearch action={`/dashboard/${slug}/calendar`} defaultValue={codeQuery} />
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
