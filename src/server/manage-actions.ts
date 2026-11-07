"use server";
/**
 * Үйлчлүүлэгч SMS-ийн холбоосоор (/manage/<token>) захиалгаа цуцлах, шилжүүлэх.
 * Токен = нэвтрэлт. Бодлого: tenant.settings.cancellationHours (src/lib/policy.ts).
 */
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, pgErrorCode, PG_EXCLUSION_VIOLATION, schema } from "@/db";
import {
  cancelScheduledNotifications,
  getBookingByManageToken,
  getService,
  moveBooking,
  updateBookingStatus,
} from "@/db/tenant";
import { customerChangeBlock } from "@/lib/policy";
import { getAvailability } from "./availability";
import { bookingWhen, notifyBusiness, notifyCustomer, scheduleReminders, SLOT_TAKEN_MESSAGE } from "./booking-core";

export type ManageResult = { ok: true } | { ok: false; message: string };
/** Шилжүүлсний дараа: шинэ цаг ба төлөв (гараар батлах байгууллагад дахин "pending" болно) */
export type RescheduleResult =
  | { ok: true; status: "pending" | "confirmed"; day: string; time: string }
  | { ok: false; message: string };

const Token = z.string().min(16).max(64).regex(/^[A-Za-z0-9_-]+$/);
const DateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

type Failure = { ok: false; message: string };
const NOT_FOUND: Failure = { ok: false, message: "Захиалга олдсонгүй" };

type Loaded =
  | { error: Failure; row?: undefined }
  | { error?: undefined; row: NonNullable<Awaited<ReturnType<typeof getBookingByManageToken>>> };

async function load(token: string): Promise<Loaded> {
  const row = await getBookingByManageToken(token);
  if (!row) return { error: NOT_FOUND };
  const block = customerChangeBlock({
    status: row.booking.status,
    startsAt: row.booking.startsAt,
    now: new Date(),
    cancellationHours: row.tenant.settings.cancellationHours,
  });
  if (block === "status") return { error: { ok: false, message: "Энэ захиалгыг өөрчлөх боломжгүй" } };
  if (block === "too_late") {
    return {
      error: {
        ok: false,
        message: `Эхлэхэд ${row.tenant.settings.cancellationHours} цагаас бага хугацаа үлдсэн тул байгууллага руу залгана уу`,
      },
    };
  }
  return { row };
}

async function audit(tenantId: string, action: string, bookingId: string, diff?: unknown) {
  await db().insert(schema.auditLogs).values({ tenantId, actorId: null, action, entity: "booking", entityId: bookingId, diff: diff ?? null });
}

export async function cancelByCustomer(raw: unknown): Promise<ManageResult> {
  const parsed = Token.safeParse(raw);
  if (!parsed.success) return NOT_FOUND;
  const r = await load(parsed.data);
  if (r.error) return r.error;
  const { booking, tenant } = r.row;

  const after = await updateBookingStatus(tenant.id, booking.id, "cancelled", {
    from: ["pending", "confirmed"],
    cancelledBy: "customer",
  });
  if (!after) return { ok: false, message: "Энэ захиалгыг өөрчлөх боломжгүй" };
  await cancelScheduledNotifications(tenant.id, booking.id);
  await audit(tenant.id, "booking.customer_cancel", booking.id);
  // Байгууллага ба үйлчлүүлэгчид мэдэгдэнэ (SMS алдаа цуцлалтыг унагаахгүй)
  await notifyBusiness(tenant, after, { customerName: r.row.customerName, serviceName: r.row.serviceName }, { kind: "cancelled" });
  await notifyCustomer(tenant, after, r.row.customerPhone, "cancelled");
  revalidatePath(`/manage/${parsed.data}`);
  revalidatePath(`/dashboard/${tenant.slug}`, "layout");
  return { ok: true };
}

const MoveInput = z.object({ token: Token, date: DateStr, startMin: z.number().int().min(0).max(1439) });

export async function rescheduleByCustomer(raw: unknown): Promise<RescheduleResult> {
  const parsed = MoveInput.safeParse(raw);
  if (!parsed.success) return { ok: false, message: "Мэдээлэл буруу" };
  const r = await load(parsed.data.token);
  if (r.error) return r.error;
  const { booking, tenant } = r.row;
  const service = await getService(tenant.id, booking.serviceId);
  if (!service) return NOT_FOUND;

  const isResource = tenant.bookingMode === "resource";
  const slots = await getAvailability({
    tenant,
    service,
    date: parsed.data.date,
    staffId: isResource ? null : booking.staffId,
    excludeBookingId: booking.id,
  });
  const slot = slots.find((s) => s.startMin === parsed.data.startMin);
  if (!slot) return { ok: false, message: SLOT_TAKEN_MESSAGE };

  // Гараар батлах байгууллагад шилжүүлсэн цаг дахин батлагдана
  const status = tenant.settings.approval === "auto" ? "confirmed" : "pending";
  for (const ownerId of slot.ownerIds) {
    try {
      const after = await moveBooking(tenant.id, booking.id, {
        startsAt: slot.startsAt,
        endsAt: slot.endsAt,
        staffId: isResource ? null : ownerId,
        resourceId: isResource ? ownerId : null,
        status,
      });
      if (!after) return NOT_FOUND;
      await cancelScheduledNotifications(tenant.id, booking.id);
      await scheduleReminders({ bookingId: booking.id, startsAt: after.startsAt });
      await audit(tenant.id, "booking.customer_reschedule", booking.id, {
        from: booking.startsAt,
        to: after.startsAt,
      });
      revalidatePath(`/manage/${parsed.data.token}`);
      revalidatePath(`/dashboard/${tenant.slug}`, "layout");
      const msg = { customerName: r.row.customerName, serviceName: service.name };
      await notifyBusiness(tenant, after, msg, { kind: "rescheduled", from: booking.startsAt });
      // Батлах хүлээж буй бол "хүлээн авлаа, батлахад SMS ирнэ", үгүй бол "цаг өөрчлөгдлөө"
      await notifyCustomer(tenant, after, r.row.customerPhone, after.status === "pending" ? "pending" : "rescheduled");
      const { day, time } = bookingWhen(tenant, after.startsAt);
      return { ok: true, status: after.status === "pending" ? "pending" : "confirmed", day, time };
    } catch (err) {
      if (pgErrorCode(err) === PG_EXCLUSION_VIOLATION) continue;
      console.error("rescheduleByCustomer", err);
      return { ok: false, message: "Алдаа гарлаа. Дахин оролдоно уу." };
    }
  }
  return { ok: false, message: SLOT_TAKEN_MESSAGE };
}
