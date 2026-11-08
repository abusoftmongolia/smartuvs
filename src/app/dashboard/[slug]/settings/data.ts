import "server-only";
/** Удирдах хуудсуудын (үйлчилгээ, ажилтан, цаг, тохиргоо) өгөгдөл — manager+ эрхтэй */
import { listAllOwners, listAllServices, listTenantSchedules, listUpcomingTimeOff } from "@/db/tenant";
import { defaultWeekHours, windowsToWeekHours } from "@/lib/hours";
import { todayIn, utcToLocalMinute } from "@/lib/time";
import { requireMember } from "@/server/auth";
import type { Info, Off, Owner, Svc } from "./types";

export { siteUrl } from "@/lib/site";

export async function manageContext(slug: string) {
  const { tenant } = await requireMember(slug, "manager");
  return { tenant, kind: tenant.bookingMode === "resource" ? ("resource" as const) : ("staff" as const), term: tenant.settings.terminology.staff };
}

export function tenantInfo(tenant: Awaited<ReturnType<typeof manageContext>>["tenant"]): Info {
  return {
    name: tenant.name,
    address: tenant.address ?? "",
    phone: tenant.phone ?? "",
    timezone: tenant.timezone === "Asia/Ulaanbaatar" ? "Asia/Ulaanbaatar" : "Asia/Hovd",
    approval: tenant.settings.approval,
    cancellationHours: tenant.settings.cancellationHours,
    slotStepMin: tenant.settings.slotStepMin,
    minLeadMin: tenant.settings.minLeadMin,
    maxAdvanceDays: tenant.settings.maxAdvanceDays,
    listed: tenant.settings.listed !== false,
    notifyNewBookings: tenant.settings.notifyNewBookings !== false,
  };
}

export async function loadServices(tenantId: string): Promise<Svc[]> {
  const services = await listAllServices(tenantId);
  return services.map((s) => ({ id: s.id, name: s.name, durationMin: s.durationMin, bufferMin: s.bufferMin, price: s.price, active: s.active }));
}

export async function loadOwners(tenantId: string, kind: "staff" | "resource"): Promise<Owner[]> {
  const owners = await listAllOwners(tenantId, kind);
  return owners.map((o) => ({ id: o.id, name: o.name, title: o.title ?? "", active: o.active }));
}

export async function loadHoursAndTimeOff(tenant: { id: string; timezone: string }, kind: "staff" | "resource") {
  const tz = tenant.timezone;
  const [owners, schedules, timeOff] = await Promise.all([
    listAllOwners(tenant.id, kind),
    listTenantSchedules(tenant.id),
    listUpcomingTimeOff(tenant.id),
  ]);
  // Ажлын цагийг эхний идэвхтэй ажилтны хуваариас уншина (бүгдэд ижил хадгалдаг)
  const ownerOf = (r: (typeof schedules)[number]) => (kind === "staff" ? r.staffId : r.resourceId);
  const ref = owners.find((o) => o.active && schedules.some((r) => ownerOf(r) === o.id));
  const hours = ref ? windowsToWeekHours(schedules.filter((r) => ownerOf(r) === ref.id)) : defaultWeekHours();
  const off: Off[] = timeOff.map((t) => {
    const from = todayIn(tz, t.startsAt);
    // endsAt нь дараагийн өдрийн 00:00 тул 1 минут хасаж сүүлийн өдрийг олно
    const to = todayIn(tz, new Date(t.endsAt.getTime() - 60_000));
    const partial = utcToLocalMinute(t.startsAt, tz) !== 0 || utcToLocalMinute(t.endsAt, tz) !== 0;
    return { id: t.id, from, to, partial, owner: owners.find((o) => o.id === (t.staffId ?? t.resourceId))?.name ?? null, reason: t.reason };
  });
  return { hours, timeOff: off, owners: owners.map((o) => ({ id: o.id, name: o.name, title: o.title ?? "", active: o.active })) };
}
