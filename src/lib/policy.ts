/** Үйлчлүүлэгч өөрөө цуцлах/шилжүүлэх бодлого — цэвэр функц (tests/policy.test.ts). */

export type ChangeBlock = "status" | "too_late" | null;

/**
 * Захиалгыг үйлчлүүлэгч өөрчилж болох эсэх.
 * `cancellationHours` цагаас бага үлдсэн бол байгууллага руу залгахыг хүснэ.
 */
export function customerChangeBlock(p: {
  status: string;
  startsAt: Date;
  now: Date;
  cancellationHours: number;
}): ChangeBlock {
  if (p.status !== "pending" && p.status !== "confirmed") return "status";
  if (p.startsAt.getTime() - p.now.getTime() < p.cancellationHours * 3600_000) return "too_late";
  return null;
}

/**
 * Хуваарьт сануулгыг илгээх үү: захиалга идэвхтэй, эхлэх цаг өнгөрөөгүй байх ёстой.
 * (Cron удааширсан ч өнгөрсөн захиалгад сануулга явуулахгүй.)
 */
export function shouldSendReminder(p: { bookingStatus: string; startsAt: Date; now: Date }): boolean {
  return (p.bookingStatus === "confirmed" || p.bookingStatus === "pending") && p.startsAt.getTime() > p.now.getTime();
}
