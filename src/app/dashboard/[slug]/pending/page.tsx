/** Батлах хүлээж буй захиалгууд — Батлах / Татгалзах / Өөр цаг санал болгох */
import { listOwners, listPendingBookings, listServices } from "@/db/tenant";
import { formatDayMn, todayIn } from "@/lib/time";
import { requireMember } from "@/server/auth";
import { PageBody, PageHeader } from "../../PageHeader";
import { toBoardBooking } from "../board";
import { DayBoard } from "../DayBoard";

export default async function PendingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { tenant } = await requireMember(slug);
  const kind = tenant.bookingMode === "resource" ? "resource" : "staff";
  const today = todayIn(tenant.timezone);
  const [owners, pending, services] = await Promise.all([
    listOwners(tenant.id, kind),
    listPendingBookings(tenant.id),
    listServices(tenant.id),
  ]);

  return (
    <>
      <PageHeader title="Хүлээгдэж буй" subtitle="Онлайнаар орсон, батлах шаардлагатай захиалгууд. Батлахад үйлчлүүлэгчид SMS очно." />
      <PageBody>
        <DayBoard
          view="pending"
          slug={tenant.slug}
          date={today}
          today={today}
          dayLabel={formatDayMn(today)}
          ownerTerm={tenant.settings.terminology.staff}
          bookingMode={tenant.bookingMode}
          owners={owners}
          workHours={[]}
          fromMin={540}
          toMin={1080}
          bookings={[]}
          pending={pending.map((b) => toBoardBooking(tenant, b))}
          services={services.map((s) => ({ id: s.id, name: s.name, durationMin: s.durationMin }))}
        />
      </PageBody>
    </>
  );
}
