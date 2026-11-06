/** Байгууллагын хүснэгт — /admin/tenants болон хайлтын хуудсанд */
import Link from "next/link";
import { INDUSTRY_PRESETS } from "@/lib/presets";
import { isTenantStatus, TENANT_STATUS_MN } from "@/lib/tenant-status";
import type { listTenantsForAdmin } from "@/db/admin";
import { fmtDate, maskPhone } from "./fmt";
import { TenantActions } from "./parts";
import { TSAG } from "./fmt";

type Row = Awaited<ReturnType<typeof listTenantsForAdmin>>[number];

const BADGE: Record<string, string> = {
  pending: "bg-brand-tint text-brand-deep",
  active: "bg-green-50 text-green-800",
  rejected: "bg-ground text-muted",
  suspended: "bg-red-50 text-red-800",
};

export function TenantList({ rows }: { rows: Row[] }) {
  if (rows.length === 0) return <p className="rounded-2xl border border-line bg-white p-6 text-muted">Байгууллага олдсонгүй.</p>;
  return (
    <div className="overflow-x-auto rounded-[22px] border border-line bg-white">
      <table className="w-full min-w-[920px] text-left text-sm">
        <thead className="border-b border-line text-xs font-medium uppercase tracking-wider text-muted">
          <tr>
            <th className="px-5 py-3">Байгууллага</th>
            <th className="px-3 py-3">Эзэмшигч</th>
            <th className="px-3 py-3">Бүртгүүлсэн</th>
            <th className="px-3 py-3 text-right">Захиалга 30х</th>
            <th className="px-3 py-3 text-right">Ирээгүй</th>
            <th className="px-3 py-3">Төлөв</th>
            <th className="px-5 py-3 text-right">Үйлдэл</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((t) => (
            <tr key={t.id} className="border-b border-line align-top last:border-b-0">
              <td className="px-5 py-4">
                <div className="font-medium">{t.name}</div>
                <div className="text-sm text-muted">
                  {INDUSTRY_PRESETS[t.industry].label} · <Link href={`${TSAG}/${t.slug}`} target="_blank" className="underline">/{t.slug}</Link>
                  {t.address ? ` · ${t.address}` : ""}
                </div>
                {t.services === 0 && <div className="text-xs font-medium text-red-800">Үйлчилгээ бүртгээгүй</div>}
              </td>
              <td className="px-3 py-4">
                <div>{t.ownerName ?? "—"}</div>
                <div className="text-sm text-muted">{maskPhone(t.ownerPhone)}</div>
              </td>
              <td className="px-3 py-4 tabular-nums">{fmtDate(t.createdAt)}</td>
              <td className="px-3 py-4 text-right tabular-nums">{t.bookings30d}</td>
              <td className="px-3 py-4 text-right tabular-nums">{t.noShow30d}</td>
              <td className="px-3 py-4">
                <span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${BADGE[t.status] ?? ""}`}>
                  {isTenantStatus(t.status) ? TENANT_STATUS_MN[t.status] : t.status}
                </span>
              </td>
              <td className="px-5 py-4">
                <div className="flex flex-col items-end gap-2">
                  <TenantActions id={t.id} name={t.name} status={t.status} />
                  <Link href={`${TSAG}/dashboard/${t.slug}`} className="inline-flex min-h-11 items-center text-sm font-medium underline">Самбар руу →</Link>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
