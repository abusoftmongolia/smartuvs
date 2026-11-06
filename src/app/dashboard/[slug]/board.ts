import "server-only";
/** Самбарын хуудсуудын нийтлэг хувиргалт: DB-ийн захиалга → DayBoard-ын BoardBooking */
import type { BookingView } from "@/db/tenant";
import { formatDayMn, formatHm, todayIn, utcToLocalMinute } from "@/lib/time";
import type { BoardBooking } from "./DayBoard";

type TenantLike = { timezone: string; bookingMode: "staff" | "resource"; settings: { customFields: { key: string; label: string }[] } };

export function toBoardBooking(tenant: TenantLike, b: BookingView): BoardBooking {
  const tz = tenant.timezone;
  const bDate = todayIn(tz, b.startsAt);
  const startMin = utcToLocalMinute(b.startsAt, tz);
  return {
    id: b.id,
    code: b.code,
    ownerId: (tenant.bookingMode === "resource" ? b.resourceId : b.staffId) ?? "",
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
}
