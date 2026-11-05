/**
 * Үйлчлүүлэгчийн захиалгын хуудас: tsag.smartuvs.mn/<slug>
 * Байгууллагыг URL-ын замаас тодорхойлно (subdomain биш).
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isTsagMaintenance } from "@/db/platform";
import { getTenantBySlug, listResources, listServices, listStaffForService } from "@/db/tenant";
import { isValidSlug } from "@/lib/slug";
import { addDays, formatPrice, todayIn, weekdayName } from "@/lib/time";
import { BookingFlow, type BookingFlowProps } from "@/components/BookingFlow";
import { SiteHeader } from "@/components/SiteHeader";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  if (!isValidSlug(slug)) return {};
  const tenant = await getTenantBySlug(slug);
  return tenant ? { title: tenant.name, description: `${tenant.name} — онлайнаар цаг захиалах` } : {};
}

export default async function TenantBookingPage({ params }: Props) {
  const { slug } = await params;
  if (!isValidSlug(slug)) notFound();
  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();

  const [svc, maintenance] = await Promise.all([listServices(tenant.id), isTsagMaintenance()]);
  const staffByService: BookingFlowProps["staffByService"] = {};
  if (tenant.bookingMode === "staff") {
    for (const s of svc) staffByService[s.id] = await listStaffForService(tenant.id, s.id);
  }
  const hasResources = tenant.bookingMode === "resource" ? (await listResources(tenant.id)).length > 0 : true;

  const today = todayIn(tenant.timezone);
  const days = Array.from({ length: 14 }, (_, i) => {
    const date = addDays(today, i);
    return { date, wd: weekdayName(date, true), num: String(Number(date.slice(8))), sub: i === 0 ? "Өнөөдөр" : i === 1 ? "Маргааш" : "" };
  });

  return (
    <div className="min-h-dvh">
      <SiteHeader tenantName={tenant.name} subtitle={tenant.address ?? undefined} phone={tenant.phone ?? undefined} />
      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Цаг захиалах</h1>
          <p className="mt-1 text-[15px] text-muted">Төлбөргүй — утасны дугаараа баталгаажуулаад л болно.</p>
        </div>
        {maintenance ? (
          <p role="status" className="rounded-card border border-line bg-white p-6 text-muted">
            Систем засвартай байна. Түр хүлээгээд дахин оролдоно уу{tenant.phone ? <> эсвэл <a href={`tel:${tenant.phone}`} className="font-bold text-ink underline">{tenant.phone}</a> руу залгана уу</> : ""}.
          </p>
        ) : svc.length === 0 || !hasResources ? (
          <p className="rounded-card border border-line bg-white p-6 text-muted">Энэ байгууллага одоогоор онлайн захиалга авахгүй байна.</p>
        ) : (
          <BookingFlow
            slug={tenant.slug}
            bookingMode={tenant.bookingMode}
            staffTerm={tenant.settings.terminology.staff}
            customFields={tenant.settings.customFields}
            services={svc.map((s) => ({
              id: s.id,
              name: s.name,
              duration: s.durationMin >= 60 ? `${Math.floor(s.durationMin / 60)} цаг${s.durationMin % 60 ? ` ${s.durationMin % 60} мин` : ""}` : `${s.durationMin} мин`,
              price: formatPrice(s.price, s.priceFrom),
            }))}
            staffByService={staffByService}
            days={days}
          />
        )}
      </main>
    </div>
  );
}
