import { PageBody, PageHeader } from "../../PageHeader";
import { Hours, TimeOff } from "../settings/Settings";
import { loadHoursAndTimeOff, manageContext } from "../settings/data";

export default async function HoursPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { tenant, kind } = await manageContext(slug);
  const { hours, timeOff, owners } = await loadHoursAndTimeOff(tenant, kind);
  return (
    <>
      <PageHeader title="Ажлын цаг, чөлөө" subtitle="Долоо хоногийн ажлын цаг, амралт, баярын өдөр" />
      <PageBody>
        <div className="flex max-w-3xl flex-col gap-5">
          <Hours slug={slug} initial={hours} />
          <TimeOff slug={slug} owners={owners} list={timeOff} />
        </div>
      </PageBody>
    </>
  );
}
