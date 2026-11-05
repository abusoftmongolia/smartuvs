import "server-only";
/**
 * Хугацаа болсон сануулгуудыг илгээнэ. /api/cron/notifications-оос 5 минут тутам дуудагдана.
 * Илгээхийн өмнө захиалга идэвхтэй, эхлээгүй эсэхийг дахин шалгана.
 */
import { claimDueNotifications, loadNotificationTargets, markNotification } from "@/db/notifications";
import { deleteExpiredSessions } from "@/db/users";
import { shouldSendReminder } from "@/lib/policy";
import { sms, smsText } from "@/lib/sms";
import { bookingWhen, manageLink } from "./booking-core";

const BATCH = 100;

export async function runDueNotifications(now = new Date()) {
  const claimed = await claimDueNotifications(now, BATCH);
  const targets = new Map((await loadNotificationTargets([...new Set(claimed.map((c) => c.bookingId))])).map((t) => [t.booking.id, t]));

  let sent = 0, skipped = 0, failed = 0;
  for (const n of claimed) {
    const t = targets.get(n.bookingId);
    if (!t || t.tenant.status !== "active" || !shouldSendReminder({ bookingStatus: t.booking.status, startsAt: t.booking.startsAt, now })) {
      await markNotification(n.id, "cancelled");
      skipped++;
      continue;
    }
    const { day, time } = bookingWhen(t.tenant, t.booking.startsAt);
    const text = smsText.reminder({ tenant: t.tenant.name, day, time, link: manageLink(t.booking.manageToken) });
    try {
      const r = await sms().send(t.phone, text);
      if (r.ok) sent++;
      else {
        await markNotification(n.id, "failed", r.error);
        failed++;
      }
    } catch (e) {
      await markNotification(n.id, "failed", e instanceof Error ? e.message : String(e));
      failed++;
    }
  }

  await deleteExpiredSessions();
  return { claimed: claimed.length, sent, skipped, failed };
}
