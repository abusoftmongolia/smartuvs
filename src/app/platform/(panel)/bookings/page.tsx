import Link from "next/link";
import { listRecentBookingsForAdmin } from "@/db/admin";
import { formatDayMn, formatHm, todayIn, utcToLocalMinute } from "@/lib/time";
import { fmtDateTime } from "../fmt";
import { TSAG } from "../fmt";

const STATUS: Record<string, string> = {
  pending: "Хүлээгдэж буй", confirmed: "Баталгаажсан", checked_in: "Ирсэн",
  completed: "Дууссан", cancelled: "Цуцлагдсан", no_show: "Ирээгүй",
};

/** Сүүлийн захиалгууд — үйлчлүүлэгчийн утсыг харуулахгүй (хамгийн бага хувийн мэдээлэл) */
export default async function AdminBookings() {
  const rows = await listRecentBookingsForAdmin(200);
  return (
    <>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Захиалгууд</h1>
        <p className="mt-1 text-sm text-muted">Сүүлд үүссэн 200 захиалга · бүх байгууллага</p>
      </div>
      <div className="overflow-x-auto rounded-[22px] border border-line bg-white">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="border-b border-line text-xs font-medium uppercase tracking-wider text-muted">
            <tr><th className="px-5 py-3">Байгууллага</th><th className="px-3 py-3">Үйлчилгээ</th><th className="px-3 py-3">Цаг</th><th className="px-3 py-3">Төлөв</th><th className="px-5 py-3">Үүссэн</th></tr>
          </thead>
          <tbody>
            {rows.map((b) => {
              const d = todayIn(b.timezone, b.startsAt);
              return (
                <tr key={b.id} className="border-b border-line last:border-b-0">
                  <td className="px-5 py-4"><Link href={`${TSAG}/dashboard/${b.tenantSlug}/calendar?date=${d}`} className="font-medium underline">{b.tenantName}</Link></td>
                  <td className="px-3 py-4">{b.serviceName}<div className="text-sm text-muted">{b.customerName} · {b.source === "online" ? "онлайн" : "гараар"}</div></td>
                  <td className="px-3 py-4 tabular-nums">{formatDayMn(d)} {formatHm(utcToLocalMinute(b.startsAt, b.timezone))}</td>
                  <td className="px-3 py-4">{STATUS[b.status] ?? b.status}</td>
                  <td className="px-5 py-4 tabular-nums text-muted">{fmtDateTime(b.createdAt)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {rows.length === 0 && <p className="p-6 text-muted">Захиалга алга.</p>}
      </div>
    </>
  );
}
