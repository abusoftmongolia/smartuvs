import "server-only";
import { computeSlots, type OwnerDay, type Slot } from "@/lib/slots";
import { addDays, localToUtc, todayIn, weekdayOf } from "@/lib/time";
import { listResources, listStaffForService, loadAvailabilityInputs } from "@/db/tenant";
import type { schema } from "@/db";

type Tenant = typeof schema.tenants.$inferSelect;
type Service = typeof schema.services.$inferSelect;

/**
 * Нэг өдрийн сул цаг. staffId = null бол "Хэн ч болно" (бүх тохирох ажилтан/нөөц).
 * Авто угаалга (bookingMode = "resource") үед ажилтны оронд боксоор тооцно.
 */
export async function getAvailability(p: {
  tenant: Tenant;
  service: Service;
  staffId: string | null;
  date: string;
  now?: Date;
}): Promise<Slot[]> {
  const { tenant, service, date } = p;
  const now = p.now ?? new Date();
  const s = tenant.settings;

  // Хугацааны хязгаар: өнгөрсөн өдөр, хэт хол өдөр
  const today = todayIn(tenant.timezone, now);
  if (date < today || date > addDays(today, s.maxAdvanceDays)) return [];

  const ownerKind = tenant.bookingMode === "resource" ? "resource" : "staff";
  let ownerIds: string[];
  if (ownerKind === "resource") {
    ownerIds = (await listResources(tenant.id)).map((r) => r.id);
  } else {
    const eligible = (await listStaffForService(tenant.id, service.id)).map((x) => x.id);
    ownerIds = p.staffId ? eligible.filter((id) => id === p.staffId) : eligible;
  }
  if (ownerIds.length === 0) return [];

  const dayStartUtc = localToUtc(date, 0, tenant.timezone);
  const dayEndUtc = localToUtc(addDays(date, 1), 0, tenant.timezone);
  const inputs = await loadAvailabilityInputs({
    tenantId: tenant.id,
    ownerIds,
    ownerKind,
    weekday: weekdayOf(date),
    dayStartUtc,
    dayEndUtc,
  });

  const owners: OwnerDay[] = ownerIds.map((id) => {
    const ownerOf = (row: { staffId: string | null; resourceId: string | null }) =>
      ownerKind === "staff" ? row.staffId : row.resourceId;
    return {
      ownerId: id,
      windows: inputs.schedules.filter((r) => ownerOf(r) === id).map((r) => ({ start: r.startMin, end: r.endMin })),
      busy: [
        ...inputs.timeOff.filter((r) => ownerOf(r) === id),
        ...inputs.bookings.filter((r) => ownerOf(r) === id),
      ].map((r) => ({ startsAt: r.startsAt, endsAt: r.endsAt })),
    };
  });

  return computeSlots(owners, {
    date,
    timeZone: tenant.timezone,
    durationMin: service.durationMin,
    bufferMin: service.bufferMin,
    stepMin: s.slotStepMin,
    minLeadMin: s.minLeadMin,
    now,
  });
}
