"use server";
/**
 * Захиалга үүсгэх — үйлчлүүлэгчийн захиалгын хуудаснаас дуудагдана.
 * Төлбөргүй. Эцсийн давхардлын хамгаалалт = Postgres exclusion constraint (23P01).
 */
import { randomBytes } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db, pgErrorCode, PG_EXCLUSION_VIOLATION, schema } from "@/db";
import { getTenantBySlug } from "@/db/tenant";
import { getAvailability } from "./availability";
import { normalizePhone, sms, smsText } from "@/lib/sms";
import { formatDayMn, formatHm } from "@/lib/time";

const { services, customers, bookings, notifications } = schema;

const BookingInput = z.object({
  slug: z.string().min(1),
  serviceId: z.string().uuid(),
  staffId: z.string().uuid().nullable(), // null = "Хэн ч болно"
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startMin: z.number().int().min(0).max(1439),
  name: z.string().trim().min(1, "Нэрээ оруулна уу").max(80),
  phone: z.string().min(8),
  answers: z.record(z.string(), z.string().max(200)).default({}),
  // TODO(Үе шат 1): otpToken — утас баталгаажсаныг нотлох. Одоогоор шалгахгүй.
});

export type BookingResult =
  | { ok: true; bookingId: string; status: "pending" | "confirmed"; day: string; time: string }
  | { ok: false; reason: "invalid" | "not_found" | "slot_taken" | "error"; message: string };

export async function createBooking(raw: unknown): Promise<BookingResult> {
  const parsed = BookingInput.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, reason: "invalid", message: parsed.error.issues[0]?.message ?? "Мэдээлэл буруу байна" };
  }
  const input = parsed.data;
  const phone = normalizePhone(input.phone);
  if (!phone) return { ok: false, reason: "invalid", message: "Утасны дугаар 8 оронтой байх ёстой" };

  const tenant = await getTenantBySlug(input.slug);
  if (!tenant) return { ok: false, reason: "not_found", message: "Байгууллага олдсонгүй" };

  const [service] = await db()
    .select()
    .from(services)
    .where(and(eq(services.id, input.serviceId), eq(services.tenantId, tenant.id), eq(services.active, true)));
  if (!service) return { ok: false, reason: "not_found", message: "Үйлчилгээ олдсонгүй" };

  // Заавал бөглөх нэмэлт талбар (машины дугаар гэх мэт)
  for (const f of tenant.settings.customFields) {
    if (f.required && !input.answers[f.key]?.trim()) {
      return { ok: false, reason: "invalid", message: `${f.label} оруулна уу` };
    }
  }

  // Сул цагийг серверт дахин тооцоолж, тэр цагт сул байгаа ажилтан/нөөцүүдийг олно
  const slots = await getAvailability({ tenant, service, staffId: input.staffId, date: input.date });
  const slot = slots.find((s) => s.startMin === input.startMin);
  if (!slot) return { ok: false, reason: "slot_taken", message: "Энэ цаг дөнгөж захиалагдлаа. Өөр цаг сонгоно уу." };

  // Харилцагч: (tenant, утас)-аар давтагдахгүй
  const [customer] = await db()
    .insert(customers)
    .values({ tenantId: tenant.id, name: input.name, phone })
    .onConflictDoUpdate({ target: [customers.tenantId, customers.phone], set: { name: sql`excluded.name` } })
    .returning();

  const status = tenant.settings.approval === "auto" ? "confirmed" : "pending";
  const isResource = tenant.bookingMode === "resource";

  // "Хэн ч болно" үед эхний сул хүнээс эхлэн оролдоно; зэрэг захиалгаар 23P01 гарвал дараагийнх руу
  for (const ownerId of slot.ownerIds) {
    try {
      const manageToken = randomBytes(18).toString("base64url");
      const [b] = await db()
        .insert(bookings)
        .values({
          tenantId: tenant.id,
          customerId: customer.id,
          serviceId: service.id,
          staffId: isResource ? null : ownerId,
          resourceId: isResource ? ownerId : null,
          startsAt: slot.startsAt,
          endsAt: slot.endsAt,
          status,
          source: "online",
          answers: input.answers,
          manageToken,
        })
        .returning();

      await scheduleNotifications({ bookingId: b.id, startsAt: b.startsAt });

      const day = formatDayMn(input.date);
      const time = formatHm(slot.startMin);
      const link = `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://tsag.smartuvs.mn"}/manage/${manageToken}`;
      await sms().send(
        phone,
        status === "confirmed"
          ? smsText.confirmed({ tenant: tenant.name, day, time, link })
          : smsText.pending({ tenant: tenant.name, day, time }),
      );

      return { ok: true, bookingId: b.id, status, day, time };
    } catch (err) {
      if (pgErrorCode(err) === PG_EXCLUSION_VIOLATION) continue;
      console.error("createBooking", err);
      return { ok: false, reason: "error", message: "Алдаа гарлаа. Дахин оролдоно уу." };
    }
  }
  return { ok: false, reason: "slot_taken", message: "Энэ цаг дөнгөж захиалагдлаа. Өөр цаг сонгоно уу." };
}

/** 24 цаг ба 2 цагийн өмнөх сануулга. Илгээх ажлыг cron (Үе шат 4) гүйцэтгэнэ. */
async function scheduleNotifications(p: { bookingId: string; startsAt: Date }) {
  const now = Date.now();
  const rows = [
    { type: "reminder_24h", sendAt: new Date(p.startsAt.getTime() - 24 * 3600_000) },
    { type: "reminder_2h", sendAt: new Date(p.startsAt.getTime() - 2 * 3600_000) },
  ].filter((r) => r.sendAt.getTime() > now);
  if (rows.length === 0) return;
  await db()
    .insert(notifications)
    .values(rows.map((r) => ({ bookingId: p.bookingId, channel: "sms" as const, type: r.type, sendAt: r.sendAt })));
}
