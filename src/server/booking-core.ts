import "server-only";
/**
 * Захиалгын нийтлэг логик — онлайн (bookings.ts) болон ажилтны самбар (dashboard-actions.ts) хоёулаа ашиглана.
 * Эцсийн давхардлын хамгаалалт = Postgres exclusion constraint (23P01).
 */
import { randomBytes } from "node:crypto";
import { db, pgErrorCode, PG_EXCLUSION_VIOLATION, PG_UNIQUE_VIOLATION, schema } from "@/db";
import { generateBookingCode } from "@/lib/booking-code";
import type { Slot } from "@/lib/slots";
import { sms, smsText } from "@/lib/sms";
import { listBookingAlertPhones } from "@/db/tenant";
import { formatDayMn, formatHm, todayIn, utcToLocalMinute } from "@/lib/time";

type Tenant = typeof schema.tenants.$inferSelect;
type Booking = typeof schema.bookings.$inferSelect;
type BookingStatus = Booking["status"];

export const SLOT_TAKEN_MESSAGE = "Энэ цаг дөнгөж захиалагдлаа. Өөр цаг сонгоно уу.";

/**
 * Сул цагт захиалга оруулна. "Хэн ч болно" үед эхний сул хүнээс эхлэн оролдож,
 * зэрэг захиалгаар 23P01 гарвал дараагийнх руу шилжинэ. Бүгд эзлэгдсэн бол null.
 */
export async function placeBooking(p: {
  tenant: Tenant;
  serviceId: string;
  customerId: string;
  slot: Slot;
  status: BookingStatus;
  source: "online" | "manual";
  answers?: Record<string, string>;
  notes?: string | null;
}): Promise<Booking | null> {
  const isResource = p.tenant.bookingMode === "resource";
  let codeRetries = 3; // код давхцах магадлал ~1/890 сая — давхцвал шинэ кодоор дахин
  for (let i = 0; i < p.slot.ownerIds.length; i++) {
    const ownerId = p.slot.ownerIds[i];
    try {
      const [b] = await db()
        .insert(schema.bookings)
        .values({
          tenantId: p.tenant.id,
          customerId: p.customerId,
          serviceId: p.serviceId,
          staffId: isResource ? null : ownerId,
          resourceId: isResource ? ownerId : null,
          startsAt: p.slot.startsAt,
          endsAt: p.slot.endsAt,
          status: p.status,
          source: p.source,
          answers: p.answers ?? {},
          notes: p.notes ?? null,
          manageToken: randomBytes(18).toString("base64url"),
          code: generateBookingCode(),
        })
        .returning();
      await scheduleReminders({ bookingId: b.id, startsAt: b.startsAt });
      return b;
    } catch (err) {
      const code = pgErrorCode(err);
      if (code === PG_EXCLUSION_VIOLATION) continue;
      if (code === PG_UNIQUE_VIOLATION && codeRetries-- > 0) { i--; continue; } // ижил ажилтанд шинэ кодоор
      throw err;
    }
  }
  return null;
}

/** 24 цаг ба 2 цагийн өмнөх сануулга. Илгээх ажлыг cron (Үе шат 4) гүйцэтгэнэ. */
export async function scheduleReminders(p: { bookingId: string; startsAt: Date }) {
  const now = Date.now();
  const rows = [
    { type: "reminder_24h", sendAt: new Date(p.startsAt.getTime() - 24 * 3600_000) },
    { type: "reminder_2h", sendAt: new Date(p.startsAt.getTime() - 2 * 3600_000) },
  ].filter((r) => r.sendAt.getTime() > now);
  if (rows.length === 0) return;
  await db()
    .insert(schema.notifications)
    .values(rows.map((r) => ({ bookingId: p.bookingId, channel: "sms" as const, type: r.type, sendAt: r.sendAt })));
}

export function manageLink(token: string) {
  return `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://tsag.smartuvs.mn"}/manage/${token}`;
}

/** Захиалгын огноо/цагийг байгууллагын бүсээр: { day: "Мягмар, 11/10", time: "10:00" } */
export function bookingWhen(tenant: Tenant, startsAt: Date) {
  const date = todayIn(tenant.timezone, startsAt);
  return { date, day: formatDayMn(date), time: formatHm(utcToLocalMinute(startsAt, tenant.timezone)) };
}

export type CustomerMessage = "pending" | "confirmed" | "rescheduled" | "cancelled";

/** Захиалагч руу SMS. Алдаа гарвал захиалгыг унагаахгүй, зөвхөн логлоно. */
export async function notifyCustomer(tenant: Tenant, booking: Booking, phone: string, kind: CustomerMessage) {
  const { day, time } = bookingWhen(tenant, booking.startsAt);
  const link = manageLink(booking.manageToken);
  const base = { tenant: tenant.name, day, time, code: booking.code };
  const text =
    kind === "confirmed" ? smsText.confirmed({ ...base, link })
    : kind === "rescheduled" ? smsText.rescheduled({ ...base, link })
    : kind === "cancelled" ? smsText.cancelled(base)
    : smsText.pending({ ...base, link });
  try {
    const r = await sms().send(phone, text);
    if (!r.ok) console.error(`[sms] ${kind} илгээж чадсангүй: ${r.error}`);
  } catch (e) {
    console.error(`[sms] ${kind}`, e);
  }
}

export type BusinessMessage =
  | { kind: "new" }
  | { kind: "cancelled" }
  /** `from` — шилжүүлэхээс өмнөх эхлэх цаг */
  | { kind: "rescheduled"; from: Date };

/**
 * Байгууллагад SMS: шинэ онлайн захиалга, үйлчлүүлэгч цуцалсан/шилжүүлсэн (тохиргоонд унтраагаагүй бол).
 * SMS-ийн зардлыг байгууллага хариуцна. Үйлчлүүлэгчийн утсыг SMS-д бичихгүй — самбараас харна.
 * Алдаа гарвал захиалгыг унагаахгүй.
 */
export async function notifyBusiness(
  tenant: Tenant,
  booking: Booking,
  p: { customerName: string; serviceName: string },
  msg: BusinessMessage = { kind: "new" },
) {
  if (tenant.settings.notifyNewBookings === false) return;
  try {
    const phones = await listBookingAlertPhones(tenant, booking.staffId);
    const { day, time } = bookingWhen(tenant, booking.startsAt);
    const base = { customer: p.customerName, service: p.serviceName, day, time, code: booking.code };
    let text: string;
    if (msg.kind === "cancelled") text = smsText.customerCancelled(base);
    else if (msg.kind === "rescheduled") {
      const was = bookingWhen(tenant, msg.from);
      text = smsText.customerRescheduled({ ...base, from: `${was.day} ${was.time}`, pending: booking.status === "pending" });
    } else text = smsText.newBooking({ ...base, pending: booking.status === "pending" });
    for (const to of phones) {
      const r = await sms().send(to, text);
      if (!r.ok) console.error(`[sms] business/${msg.kind} илгээж чадсангүй: ${r.error}`);
    }
  } catch (e) {
    console.error(`[sms] business/${msg.kind}`, e);
  }
}
