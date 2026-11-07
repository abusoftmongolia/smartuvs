/**
 * Үйлчлүүлэгчийн захиалгын хуудас: tsag.smartuvs.mn/<slug>
 * Байгууллагыг URL-ын замаас тодорхойлно (subdomain биш).
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isTsagMaintenance } from "@/db/platform";
import { getTenantBySlug, listResources, listServices, listStaffByServices } from "@/db/tenant";
import { isValidSlug } from "@/lib/slug";
import { bookingDays, cancelPolicyText } from "@/lib/booking-ui";
import { formatPrice, todayIn } from "@/lib/time";
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
  const [staffByService, hasResources]: [BookingFlowProps["staffByService"], boolean] = await Promise.all([
    tenant.bookingMode === "staff" ? listStaffByServices(tenant.id, svc.map((s) => s.id)) : Promise.resolve({}),
    tenant.bookingMode === "resource" ? listResources(tenant.id).then((r) => r.length > 0) : Promise.resolve(true),
  ]);

  // 14 хоног, гэхдээ байгууллагын maxAdvanceDays-аас цааш хоосон өдөр харуулахгүй
  const days = bookingDays(todayIn(tenant.timezone), tenant.settings.maxAdvanceDays);

  return (
    <div className="min-h-dvh">
      <SiteHeader tenantName={tenant.name} tenantSlug={tenant.slug} tenantLogo={tenant.logoUrl} subtitle={tenant.address ?? undefined} phone={tenant.phone ?? undefined} />
      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Цаг захиалах</h1>
          <p className="mt-1 text-sm text-muted">Захиалга төлбөргүй — үйлчилгээний төлбөрөө газар дээр нь төлнө.</p>
        </div>
        {maintenance ? (
          <p role="status" className="rounded-card border border-line bg-white p-6 text-muted">
            Систем засвартай байна. Түр хүлээгээд дахин оролдоно уу{tenant.phone ? <> эсвэл <a href={`tel:${tenant.phone}`} className="font-medium text-ink underline">{tenant.phone}</a> руу залгана уу</> : ""}.
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
            cancelPolicy={cancelPolicyText(tenant.settings.cancellationHours)}
          />
        )}
      </main>
    </div>
  );
}
