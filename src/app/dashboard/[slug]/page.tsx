/**
 * Ажилтны самбар — өдрийн календарь (ажилтан/боксоор баганалсан) + батлах хүлээж буй жагсаалт.
 * /dashboard/<slug>?date=YYYY-MM-DD
 */
import Link from "next/link";
import {
  getBookingByCode,
  listBookingsInRange,
  listOwners,
  listPendingBookings,
  listSchedulesForWeekday,
  listServices,
  type BookingView,
} from "@/db/tenant";
import { formatBookingCode, normalizeBookingCode } from "@/lib/booking-code";
import { addDays, formatDayMn, formatHm, localToUtc, todayIn, utcToLocalMinute, weekdayOf } from "@/lib/time";
import { requireMember } from "@/server/auth";
import { DayBoard, type BoardBooking } from "./DayBoard";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ date?: string; code?: string }> };

export default async function TenantDashboard({ params, searchParams }: Props) {
  const { slug } = await params;
  const { tenant, role } = await requireMember(slug);
  const tz = tenant.timezone;
  const today = todayIn(tz);
  const sp = await searchParams;
  // Кодоор хайлт (?code=X4K9M2): олдвол тэр өдрийг нээж, захиалгыг шууд харуулна
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

  const toDto = (b: BookingView): BoardBooking => {
    const bDate = todayIn(tz, b.startsAt);
    const startMin = utcToLocalMinute(b.startsAt, tz);
    return {
      id: b.id,
      code: b.code,
      ownerId: (kind === "resource" ? b.resourceId : b.staffId) ?? "",
      date: bDate,
      dayLabel: formatDayMn(bDate),
      startMin,
      endMin: startMin + b.durationMin,
      timeLabel: `${formatHm(startMin)}–${formatHm(startMin + b.durationMin)}`,
      status: b.status,
      source: b.source,
      serviceId: b.serviceId,
      serviceName: b.serviceName,
      customerName: b.customerName,
      customerPhone: b.customerPhone,
      noShowCount: b.noShowCount,
      answers: Object.entries(b.answers ?? {})
        .filter(([, v]) => v)
        .map(([k, v]) => ({ label: tenant.settings.customFields.find((f) => f.key === k)?.label ?? k, value: v })),
      notes: b.notes,
    };
  };

  // Календарийн цагийн хүрээ: ажлын цаг + захиалгуудыг багтаана
  const ownerSchedules = schedules.filter((s) => (kind === "resource" ? s.resourceId : s.staffId));
  const items = dayBookings.map(toDto);
  const starts = [...ownerSchedules.map((s) => s.startMin), ...items.map((b) => b.startMin)];
  const ends = [...ownerSchedules.map((s) => s.endMin), ...items.map((b) => b.endMin)];
  const fromMin = starts.length ? Math.floor(Math.min(...starts) / 60) * 60 : 9 * 60;
  const toMin = ends.length ? Math.min(1440, Math.ceil(Math.max(...ends) / 60) * 60) : 18 * 60;

  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{tenant.name}</h1>
          <p className="text-sm text-muted">
            Захиалгын хуудас:{" "}
            <Link href={`/${tenant.slug}`} className="font-semibold text-brand-deep underline" target="_blank">
              tsag.smartuvs.mn/{tenant.slug}
            </Link>
          </p>
        </div>
        <form action={`/dashboard/${tenant.slug}`} method="get" role="search" className="flex gap-2">
          <label htmlFor="code-search" className="sr-only">Захиалгын кодоор хайх</label>
          <input id="code-search" name="code" defaultValue={codeQuery} placeholder="Код: X4K9M2" autoComplete="off" maxLength={20}
            className="min-h-11 w-36 rounded-xl border border-line bg-white px-3 font-mono text-sm uppercase outline-none focus:border-ink" />
          <button className="inline-flex min-h-11 items-center rounded-xl border border-line bg-white px-4 text-sm font-medium">Хайх</button>
        </form>
        {(role === "owner" || role === "manager") && (
          <Link href={`/dashboard/${tenant.slug}/settings`} className="inline-flex min-h-11 items-center rounded-xl border border-line bg-white px-4 text-sm font-medium">
            Тохиргоо
          </Link>
        )}
      </div>

      {codeQuery && !found && (
        <p role="alert" className="rounded-card border border-line bg-white p-4 text-sm">
          <b>{code ? formatBookingCode(code) : codeQuery}</b> кодтой захиалга олдсонгүй. Код 6 тэмдэгттэй (жишээ нь X4K9M2).
        </p>
      )}

      {tenant.status !== "active" && (
        <p role="status" className="rounded-card border-2 border-brand bg-brand-tint p-4 text-sm">
          {tenant.status === "pending"
            ? <><b>Таны байгууллага хянагдаж байна.</b> Батлагдмагц захиалгын хуудас нээгдэж, танд SMS ирнэ. Энэ хооронд үйлчилгээ, ажлын цагаа тохируулж болно.</>
            : tenant.status === "rejected"
              ? <><b>Бүртгэл батлагдаагүй.</b> Дэлгэрэнгүйг SmartUvs-ээс лавлана уу.</>
              : <><b>Байгууллага түр хаагдсан.</b> Захиалгын хуудас нийтэд харагдахгүй байна.</>}
        </p>
      )}

      <DayBoard
        key={found?.id ?? "board"} // өөр код хайхад диалог дахин нээгдэнэ
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
        initialOpen={found ? toDto(found) : null}
        services={services.map((s) => ({ id: s.id, name: s.name, durationMin: s.durationMin }))}
      />
    </main>
  );
}
