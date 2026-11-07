"use server";
/**
 * Ажилтны самбарын үйлдлүүд. Бүгд: (1) нэвтэрсэн, энэ байгууллагын гишүүн эсэхийг шалгана,
 * (2) зөвхөн tenant-аар шүүсэн query (src/db/tenant.ts), (3) audit_logs-д бичнэ.
 */
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, pgErrorCode, PG_EXCLUSION_VIOLATION, schema } from "@/db";
import {
  cancelScheduledNotifications,
  getBooking,
  getCustomer,
  getService,
  incrementNoShow,
  moveBooking,
  updateBookingStatus,
  upsertCustomer,
} from "@/db/tenant";
import { normalizePhone } from "@/lib/sms";
import { getAvailability } from "./availability";
import { memberOrNull } from "./auth";
import { notifyCustomer, placeBooking, scheduleReminders, SLOT_TAKEN_MESSAGE } from "./booking-core";

export type ActionResult = { ok: true } | { ok: false; message: string };

const NO_ACCESS: ActionResult = { ok: false, message: "Эрх хүрэхгүй байна. Дахин нэвтэрнэ үү." };
const NOT_FOUND: ActionResult = { ok: false, message: "Захиалга олдсонгүй эсвэл аль хэдийн өөрчлөгдсөн байна" };

const Slug = z.string().min(1).max(64);
const Id = z.string().uuid();
const DateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

async function audit(tenantId: string, actorId: string, action: string, entityId: string, diff?: unknown) {
  await db().insert(schema.auditLogs).values({ tenantId, actorId, action, entity: "booking", entityId, diff: diff ?? null });
}

function refresh(slug: string) {
  revalidatePath(`/dashboard/${slug}`, "layout");
}

// ── Төлөв солих ───────────────────────────────────────────────────────────

const StatusInput = z.object({
  slug: Slug,
  bookingId: Id,
  action: z.enum(["confirm", "decline", "cancel", "arrived", "completed", "no_show", "undo"]),
});

export async function setBookingStatus(raw: unknown): Promise<ActionResult> {
  const parsed = StatusInput.safeParse(raw);
  if (!parsed.success) return { ok: false, message: "Мэдээлэл буруу" };
  const { slug, bookingId, action } = parsed.data;
  const m = await memberOrNull(slug);
  if (!m) return NO_ACCESS;
  const { tenant, user } = m;

  const before = await getBooking(tenant.id, bookingId);
  if (!before) return NOT_FOUND;

  const t = {
    confirm: { to: "confirmed", from: ["pending"] },
    decline: { to: "cancelled", from: ["pending"] },
    cancel: { to: "cancelled", from: ["pending", "confirmed"] },
    arrived: { to: "checked_in", from: ["confirmed", "pending", "no_show"] },
    completed: { to: "completed", from: ["checked_in", "confirmed"] },
    no_show: { to: "no_show", from: ["confirmed", "checked_in"] },
    undo: { to: "confirmed", from: ["checked_in", "completed", "no_show"] },
  } as const;
  const { to, from } = t[action];

  let after;
  try {
    after = await updateBookingStatus(tenant.id, bookingId, to, { from: [...from], cancelledBy: "staff" });
  } catch (err) {
    // "Ирээгүй"-г буцаахад тэр цаг өөр захиалгад өгөгдсөн байж болно
    if (pgErrorCode(err) === PG_EXCLUSION_VIOLATION) return { ok: false, message: "Энэ цагт өөр захиалга орсон байна" };
    throw err;
  }
  if (!after) return NOT_FOUND;

  // Ирээгүйн тоо: үйлчлүүлэгчийн түүхэнд харагдана
  if (to === "no_show") await incrementNoShow(tenant.id, after.customerId, 1);
  if (before.status === "no_show" && to !== "no_show") await incrementNoShow(tenant.id, after.customerId, -1);

  if (to === "cancelled") await cancelScheduledNotifications(tenant.id, bookingId);

  if (action === "confirm" || action === "decline" || action === "cancel") {
    const customer = await getCustomer(tenant.id, after.customerId);
    if (customer) await notifyCustomer(tenant, after, customer.phone, to === "confirmed" ? "confirmed" : "cancelled");
  }

  await audit(tenant.id, user.id, `booking.${action}`, bookingId, { from: before.status, to });
  refresh(slug);
  return { ok: true };
}

// ── Өөр цаг санал болгох (шилжүүлэх) ──────────────────────────────────────

const MoveInput = z.object({
  slug: Slug,
  bookingId: Id,
  date: DateStr,
  startMin: z.number().int().min(0).max(1439),
  ownerId: Id.nullable(),
});

export async function rescheduleBooking(raw: unknown): Promise<ActionResult> {
  const parsed = MoveInput.safeParse(raw);
  if (!parsed.success) return { ok: false, message: "Мэдээлэл буруу" };
  const { slug, bookingId, date, startMin, ownerId } = parsed.data;
  const m = await memberOrNull(slug);
  if (!m) return NO_ACCESS;
  const { tenant, user } = m;

  const before = await getBooking(tenant.id, bookingId);
  if (!before || !["pending", "confirmed"].includes(before.status)) return NOT_FOUND;
  const service = await getService(tenant.id, before.serviceId);
  if (!service) return NOT_FOUND;

  const isResource = tenant.bookingMode === "resource";
  const slots = await getAvailability({
    tenant, service, date, ignoreLead: true, excludeBookingId: bookingId,
    staffId: isResource ? null : ownerId,
  });
  const slot = slots.find((s) => s.startMin === startMin);
  const owner = slot && (ownerId && slot.ownerIds.includes(ownerId) ? ownerId : slot.ownerIds[0]);
  if (!slot || !owner) return { ok: false, message: SLOT_TAKEN_MESSAGE };

  let after;
  try {
    after = await moveBooking(tenant.id, bookingId, {
      startsAt: slot.startsAt,
      endsAt: slot.endsAt,
      staffId: isResource ? null : owner,
      resourceId: isResource ? owner : null,
      status: "confirmed",
    });
  } catch (err) {
    if (pgErrorCode(err) === PG_EXCLUSION_VIOLATION) return { ok: false, message: SLOT_TAKEN_MESSAGE };
    throw err;
  }
  if (!after) return NOT_FOUND;

  await cancelScheduledNotifications(tenant.id, bookingId);
  await scheduleReminders({ bookingId, startsAt: after.startsAt });
  const customer = await getCustomer(tenant.id, after.customerId);
  if (customer) await notifyCustomer(tenant, after, customer.phone, "rescheduled");

  await audit(tenant.id, user.id, "booking.reschedule", bookingId, {
    from: { startsAt: before.startsAt, staffId: before.staffId, resourceId: before.resourceId },
    to: { startsAt: after.startsAt, staffId: after.staffId, resourceId: after.resourceId },
  });
  refresh(slug);
  return { ok: true };
}

// ── Гараар захиалга нэмэх (утсаар, биеэр ирсэн) ──────────────────────────

const ManualInput = z.object({
  slug: Slug,
  serviceId: Id,
  ownerId: Id.nullable(),
  date: DateStr,
  startMin: z.number().int().min(0).max(1439),
  name: z.string().trim().min(1, "Нэр оруулна уу").max(80),
  phone: z.string().max(32),
  notes: z.string().trim().max(500).optional(),
  notify: z.boolean().default(true),
});

export async function createManualBooking(raw: unknown): Promise<ActionResult> {
  const parsed = ManualInput.safeParse(raw);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Мэдээлэл буруу" };
  const input = parsed.data;
  const phone = normalizePhone(input.phone);
  if (!phone) return { ok: false, message: "Утасны дугаар 8 оронтой байх ёстой" };

  const m = await memberOrNull(input.slug);
  if (!m) return NO_ACCESS;
  const { tenant, user } = m;
  const service = await getService(tenant.id, input.serviceId);
  if (!service || !service.active) return { ok: false, message: "Үйлчилгээ олдсонгүй" };

  const isResource = tenant.bookingMode === "resource";
  const slots = await getAvailability({
    tenant, service, date: input.date, ignoreLead: true, staffId: isResource ? null : input.ownerId,
  });
  const found = slots.find((s) => s.startMin === input.startMin);
  if (!found) return { ok: false, message: SLOT_TAKEN_MESSAGE };
  // Нөөц горимд тодорхой бокс сонгосон бол түүнийг эхэнд нь тавина
  const slot = input.ownerId && found.ownerIds.includes(input.ownerId)
    ? { ...found, ownerIds: [input.ownerId, ...found.ownerIds.filter((x) => x !== input.ownerId)] }
    : found;

  const customer = await upsertCustomer(tenant.id, input.name, phone);
  const b = await placeBooking({
    tenant, serviceId: service.id, customerId: customer.id, slot, status: "confirmed", source: "manual",
    notes: input.notes || null,
  });
  if (!b) return { ok: false, message: SLOT_TAKEN_MESSAGE };
  if (input.notify) await notifyCustomer(tenant, b, phone, "confirmed");

  await audit(tenant.id, user.id, "booking.manual", b.id);
  refresh(input.slug);
  return { ok: true };
}
