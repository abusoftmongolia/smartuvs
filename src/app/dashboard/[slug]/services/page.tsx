import { PageBody, PageHeader } from "../../PageHeader";
import { Services } from "./Services";
import { loadServices, manageContext } from "../settings/data";

export default async function ServicesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { tenant } = await manageContext(slug);
  const services = await loadServices(tenant.id);
  return (
    <>
      <PageHeader title="Үйлчилгээ" subtitle="Үйлчлүүлэгч захиалахдаа сонгох үйлчилгээ, үргэлжлэх хугацаа, үнэ" />
      <PageBody>
        <div className="max-w-3xl">
          {/* Хадгалахад шинэ id-г action-оос авна — remount хийж хадгалаагүй мөрийг алдахгүй */}
          <Services slug={slug} initial={services} />
        </div>
      </PageBody>
    </>
  );
}
