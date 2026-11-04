import Link from "next/link";
import { listAllOwners, listAllServices, listTenantSchedules, listUpcomingTimeOff } from "@/db/tenant";
import { defaultWeekHours, windowsToWeekHours } from "@/lib/hours";
import { todayIn, utcToLocalMinute } from "@/lib/time";
import { requireMember } from "@/server/auth";
import { Settings } from "./Settings";

export default async function SettingsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { tenant } = await requireMember(slug, "manager");
  const kind = tenant.bookingMode === "resource" ? "resource" : "staff";
  const tz = tenant.timezone;

  const [services, owners, schedules, timeOff] = await Promise.all([
    listAllServices(tenant.id),
    listAllOwners(tenant.id, kind),
    listTenantSchedules(tenant.id),
    listUpcomingTimeOff(tenant.id),
  ]);

  // Ажлын цагийг эхний идэвхтэй ажилтны хуваариас уншина (бүгдэд ижил хадгалдаг)
  const ownerOf = (r: (typeof schedules)[number]) => (kind === "staff" ? r.staffId : r.resourceId);
  const ref = owners.find((o) => o.active && schedules.some((r) => ownerOf(r) === o.id));
  const hours = ref ? windowsToWeekHours(schedules.filter((r) => ownerOf(r) === ref.id)) : defaultWeekHours();

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://tsag.smartuvs.mn").replace(/\/$/, "");

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-5 px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold">Тохиргоо · {tenant.name}</h1>
        <Link href={`/dashboard/${slug}`} className="inline-flex min-h-11 items-center rounded-xl border border-line bg-white px-4 text-sm font-bold">
          ← Календарь
        </Link>
      </div>
      <Settings
        slug={slug}
        bookingUrl={`${siteUrl}/${slug}`}
        term={tenant.settings.terminology.staff}
        kind={kind}
        info={{
          name: tenant.name,
          address: tenant.address ?? "",
          phone: tenant.phone ?? "",
          timezone: tenant.timezone === "Asia/Ulaanbaatar" ? "Asia/Ulaanbaatar" : "Asia/Hovd",
          approval: tenant.settings.approval,
          cancellationHours: tenant.settings.cancellationHours,
          slotStepMin: tenant.settings.slotStepMin,
          minLeadMin: tenant.settings.minLeadMin,
          maxAdvanceDays: tenant.settings.maxAdvanceDays,
        }}
        services={services.map((s) => ({ id: s.id, name: s.name, durationMin: s.durationMin, bufferMin: s.bufferMin, price: s.price, active: s.active }))}
        owners={owners.map((o) => ({ id: o.id, name: o.name, title: o.title ?? "", active: o.active }))}
        hours={hours}
        timeOff={timeOff.map((t) => {
          const from = todayIn(tz, t.startsAt);
          // endsAt нь дараагийн өдрийн 00:00 тул 1 минут хасаж сүүлийн өдрийг олно
          const to = todayIn(tz, new Date(t.endsAt.getTime() - 60_000));
          const partial = utcToLocalMinute(t.startsAt, tz) !== 0 || utcToLocalMinute(t.endsAt, tz) !== 0;
          return {
            id: t.id,
            from,
            to,
            partial,
            owner: owners.find((o) => o.id === (t.staffId ?? t.resourceId))?.name ?? null,
            reason: t.reason,
          };
        })}
      />
    </main>
  );
}
