"use server";
/**
 * Захиалга үүсгэх — үйлчлүүлэгчийн захиалгын хуудаснаас дуудагдана.
 * Төлбөргүй. Эцсийн давхардлын хамгаалалт = Postgres exclusion constraint (23P01).
 */
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { getTenantBySlug, upsertCustomer } from "@/db/tenant";
import { normalizePhone } from "@/lib/sms";
import { getAvailability } from "./availability";
import { bookingWhen, notifyCustomer, placeBooking, SLOT_TAKEN_MESSAGE } from "./booking-core";
import { isPhoneVerified } from "./phone-verification";

const { services } = schema;

const BookingInput = z.object({
  slug: z.string().min(1),
  serviceId: z.string().uuid(),
  staffId: z.string().uuid().nullable(), // null = "Хэн ч болно"
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startMin: z.number().int().min(0).max(1439),
  name: z.string().trim().min(1, "Нэрээ оруулна уу").max(80),
  phone: z.string().min(8),
  answers: z.record(z.string(), z.string().max(200)).default({}),
  /** Утас баталгаажсаныг нотлох токен (verify-actions.ts → startPhoneVerification) */
  verifyToken: z.string().min(1).max(1024),
});

export type BookingResult =
  | { ok: true; bookingId: string; status: "pending" | "confirmed"; day: string; time: string }
  | { ok: false; reason: "invalid" | "unverified" | "not_found" | "slot_taken" | "error"; message: string };

export async function createBooking(raw: unknown): Promise<BookingResult> {
  const parsed = BookingInput.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, reason: "invalid", message: parsed.error.issues[0]?.message ?? "Мэдээлэл буруу байна" };
  }
  const input = parsed.data;
  const phone = normalizePhone(input.phone);
  if (!phone) return { ok: false, reason: "invalid", message: "Утасны дугаар 8 оронтой байх ёстой" };
  if (!(await isPhoneVerified(input.verifyToken, phone))) {
    return { ok: false, reason: "unverified", message: "Утасны дугаараа баталгаажуулна уу" };
  }

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
  if (!slot) return { ok: false, reason: "slot_taken", message: SLOT_TAKEN_MESSAGE };

  const customer = await upsertCustomer(tenant.id, input.name, phone);
  const status = tenant.settings.approval === "auto" ? "confirmed" : "pending";
  try {
    const b = await placeBooking({
      tenant, serviceId: service.id, customerId: customer.id, slot, status, source: "online", answers: input.answers,
    });
    if (!b) return { ok: false, reason: "slot_taken", message: SLOT_TAKEN_MESSAGE };
    await notifyCustomer(tenant, b, phone, status);
    const { day, time } = bookingWhen(tenant, b.startsAt);
    return { ok: true, bookingId: b.id, status, day, time };
  } catch (err) {
    console.error("createBooking", err);
    return { ok: false, reason: "error", message: "Алдаа гарлаа. Дахин оролдоно уу." };
  }
}
