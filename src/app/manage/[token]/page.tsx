/**
 * Үйлчлүүлэгчийн захиалга: tsag.smartuvs.mn/manage/<token> (SMS-ийн холбоос)
 * Харах, календарьт нэмэх, цуцлах, өөр цаг руу шилжүүлэх.
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { getBookingByManageToken } from "@/db/tenant";
import { formatBookingCode } from "@/lib/booking-code";
import { customerChangeBlock } from "@/lib/policy";
import { approvalWaitText, bookingDays } from "@/lib/booking-ui";
import { formatDayMn, formatHm, todayIn, utcToLocalMinute } from "@/lib/time";
import { ManageBooking } from "./ManageBooking";

export const dynamic = "force-dynamic";
// Токен URL-д байгаа тул хайлтад орохгүй, гадагш referrer-ээр задрахгүй
export const metadata: Metadata = { title: "Миний захиалга", robots: { index: false, follow: false }, referrer: "no-referrer" };

const STATUS_MN: Record<string, string> = {
  pending: "Батлах хүлээж буй",
  confirmed: "Баталгаажсан",
  checked_in: "Ирсэн",
  completed: "Дууссан",
  cancelled: "Цуцлагдсан",
  no_show: "Ирээгүй",
};

export default async function ManagePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(token)) notFound();
  const row = await getBookingByManageToken(token);
  if (!row) notFound();
  const { booking, tenant } = row;
  const tz = tenant.timezone;

  const date = todayIn(tz, booking.startsAt);
  const startMin = utcToLocalMinute(booking.startsAt, tz);
  const block = customerChangeBlock({
    status: booking.status,
    startsAt: booking.startsAt,
    now: new Date(),
    cancellationHours: tenant.settings.cancellationHours,
  });
  const active = booking.status === "pending" || booking.status === "confirmed";

  const days = bookingDays(todayIn(tz), tenant.settings.maxAdvanceDays);

  return (
    <div className="min-h-dvh">
      <SiteHeader tenantName={tenant.name} tenantSlug={tenant.slug} tenantLogo={tenant.logoUrl} subtitle={tenant.address ?? undefined} phone={tenant.phone ?? undefined} />
      <main className="mx-auto flex max-w-xl flex-col gap-5 px-4 py-6">
        <h1 className="text-2xl font-bold">Таны захиалга</h1>
        <dl className="flex flex-col gap-2.5 rounded-[18px] border border-line bg-white p-5 text-sm">
          <Row k="Код" v={formatBookingCode(booking.code)} />
          <Row k="Төлөв" v={STATUS_MN[booking.status] ?? booking.status} />
          <Row k="Өдөр" v={formatDayMn(date)} />
          <Row k="Цаг" v={`${formatHm(startMin)}–${formatHm(startMin + row.durationMin)}`} />
          <Row k="Үйлчилгээ" v={row.serviceName} />
          {(row.staffName ?? row.resourceName) && <Row k={tenant.settings.terminology.staff} v={(row.staffName ?? row.resourceName)!} />}
          <Row k="Нэр" v={row.customerName} />
        </dl>
        <ManageBooking
          token={token}
          active={active}
          block={block}
          cancellationHours={tenant.settings.cancellationHours}
          tenantPhone={tenant.phone}
          slug={tenant.slug}
          days={days}
          currentDate={date}
          approvalText={approvalWaitText(tenant.bookingMode, tenant.settings.terminology.staff)}
        />
      </main>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-xs text-muted">{k}</dt>
      <dd className="text-right font-medium">{v}</dd>
    </div>
  );
}
