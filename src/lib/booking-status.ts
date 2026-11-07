/**
 * Захиалгын төлөвийн шошго ба өнгө — бүх хуудсанд НЭГ эх сурвалж.
 * (Өмнө нь 6 газар тус тусдаа, "Хүлээгдэж буй" / "Батлах хүлээж буй" гэж зөрүүтэй байсан.)
 */
export const BOOKING_STATUSES = ["pending", "confirmed", "checked_in", "completed", "cancelled", "no_show"] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

type StatusStyle = {
  label: string;
  /** Жагсаалт, хүснэгтийн шошго (badge) */
  badge: string;
  /** Календарийн блок */
  card: string;
  /** Сарын харагдацын цэг */
  dot: string;
};

export const BOOKING_STATUS: Record<BookingStatus, StatusStyle> = {
  pending: { label: "Батлах хүлээж буй", badge: "bg-blue-50 text-blue-800", card: "border-pending border-dashed bg-blue-50", dot: "bg-pending" },
  confirmed: { label: "Баталгаажсан", badge: "bg-brand-tint text-brand-deep", card: "border-brand bg-brand-tint", dot: "bg-brand" },
  checked_in: { label: "Ирсэн", badge: "bg-green-50 text-green-800", card: "border-green-600 bg-green-50", dot: "bg-green-600" },
  completed: { label: "Дууссан", badge: "bg-ground text-muted", card: "border-line bg-ground text-muted", dot: "bg-muted/50" },
  cancelled: { label: "Цуцлагдсан", badge: "bg-ground text-muted line-through", card: "border-line bg-white text-muted line-through", dot: "bg-muted/30" },
  no_show: { label: "Ирээгүй", badge: "bg-red-50 text-red-800", card: "border-red-400 bg-red-50", dot: "bg-red-500" },
};

/** URL параметр гэх мэт итгэлгүй утгаас — prototype-ийн түлхүүр ("constructor")-ийг хүлээн авахгүй */
export function isBookingStatus(v: unknown): v is BookingStatus {
  return typeof v === "string" && (BOOKING_STATUSES as readonly string[]).includes(v);
}

export function statusLabel(v: string) {
  return isBookingStatus(v) ? BOOKING_STATUS[v].label : v;
}
