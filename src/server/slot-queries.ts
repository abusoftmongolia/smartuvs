/**
 * Сул цаг унших логик — GET route-ууд (src/app/api/.../slots) ашиглана.
 * Server action биш (уншилт), tenant-аар шүүсэн query-ууд src/db/tenant.ts-ээс.
 */
import { getBookingByManageToken, getService } from "@/db/tenant";
import { getAvailability } from "./availability";

type Tenant = NonNullable<Awaited<ReturnType<typeof getBookingByManageToken>>>["tenant"];

export type DashSlot = { label: string; startMin: number; ownerIds: string[] };

/** Ажилтны самбарын сул цаг (хамгийн эрт хязгааргүй). Үйлчилгээ олдохгүй бол null. */
export async function loadDashboardSlots(
  tenant: Tenant,
  input: { serviceId: string; date: string; ownerId: string | null; excludeBookingId?: string },
): Promise<DashSlot[] | null> {
  const service = await getService(tenant.id, input.serviceId);
  if (!service) return null;
  const slots = await getAvailability({
    tenant,
    service,
    staffId: tenant.bookingMode === "staff" ? input.ownerId : null,
    date: input.date,
    ignoreLead: true,
    excludeBookingId: input.excludeBookingId,
  });
  const { ownerId } = input;
  return slots
    .filter((s) => !ownerId || s.ownerIds.includes(ownerId))
    .map((s) => ({ label: s.label, startMin: s.startMin, ownerIds: ownerId ? [ownerId] : s.ownerIds }));
}

/** /manage/<token>: захиалгыг шилжүүлэх сул цаг. Токен буруу бол null. */
export async function loadManageSlots(token: string, date: string) {
  const row = await getBookingByManageToken(token);
  if (!row) return null;
  const { booking, tenant } = row;
  const service = await getService(tenant.id, booking.serviceId);
  if (!service) return [];
  const slots = await getAvailability({
    tenant,
    service,
    date,
    // Ажилтан горимд ижил ажилтантай нь үлдээнэ; бокс горимд аль ч сул бокс
    staffId: tenant.bookingMode === "staff" ? booking.staffId : null,
    excludeBookingId: booking.id,
  });
  return slots.map((s) => ({ label: s.label, startMin: s.startMin }));
}
