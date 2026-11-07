import { PageBody, PageHeader } from "../../PageHeader";
import { InfoForm } from "./InfoForm";
import { Logo } from "./Logo";
import { manageContext, tenantInfo } from "./data";

export default async function SettingsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { tenant } = await manageContext(slug);
  return (
    <>
      <PageHeader title="Тохиргоо" subtitle="Байгууллагын мэдээлэл, лого, захиалгын дүрэм" />
      <PageBody>
        <div className="flex max-w-3xl flex-col gap-5">
          <Logo slug={slug} name={tenant.name} logoUrl={tenant.logoUrl} />
          <InfoForm slug={slug} info={tenantInfo(tenant)} />
        </div>
      </PageBody>
    </>
  );
}
