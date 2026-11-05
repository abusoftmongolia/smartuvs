/**
 * Хуваарьт мэдэгдэл илгээх ажлын query-ууд (cron). Бүх байгууллагыг хамардаг системийн ажил.
 */
import { eq, inArray, sql } from "drizzle-orm";
import { db, schema } from "./index";

const { notifications, bookings, customers, tenants } = schema;

/**
 * Хугацаа болсон мэдэгдлүүдийг "sent" болгож авна (FOR UPDATE SKIP LOCKED).
 * Хоёр cron зэрэг ажилласан ч нэг мөрийг хоёр удаа авахгүй — нэгээс илүүгүй илгээнэ.
 */
export async function claimDueNotifications(now: Date, limit: number) {
  // Түүхий SQL-д Date биш ISO мөр дамжуулна (postgres-js сериализаци)
  const at = now.toISOString();
  const rows = await db().execute<{ id: string; booking_id: string; type: string }>(sql`
    update ${notifications} set status = 'sent', sent_at = ${at}::timestamptz
    where id in (
      select id from ${notifications}
      where status = 'scheduled' and send_at <= ${at}::timestamptz
      order by send_at
      limit ${limit}
      for update skip locked
    )
    returning id, booking_id, type`);
  return Array.from(rows).map((r) => ({ id: r.id, bookingId: r.booking_id, type: r.type }));
}

export async function loadNotificationTargets(bookingIds: string[]) {
  if (bookingIds.length === 0) return [];
  return db()
    .select({ booking: bookings, tenant: tenants, phone: customers.phone })
    .from(bookings)
    .innerJoin(tenants, eq(tenants.id, bookings.tenantId))
    .innerJoin(customers, eq(customers.id, bookings.customerId))
    .where(inArray(bookings.id, bookingIds));
}

export async function markNotification(id: string, status: "failed" | "cancelled", error?: string) {
  await db()
    .update(notifications)
    .set({ status, error: error?.slice(0, 500) ?? null, sentAt: status === "cancelled" ? null : undefined })
    .where(eq(notifications.id, id));
}
