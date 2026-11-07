import { PageBody, PageHeader } from "../../PageHeader";
import { Owners } from "./Owners";
import { loadOwners, manageContext } from "../settings/data";

export default async function StaffPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { tenant, kind, term } = await manageContext(slug);
  const owners = await loadOwners(tenant.id, kind);
  return (
    <>
      <PageHeader title={term} subtitle={kind === "resource" ? "Захиалга авах бокс, өрөө" : "Захиалга авах ажилтнууд. Идэвхгүй болговол захиалгын хуудсанд харагдахгүй."} />
      <PageBody>
        <div className="max-w-3xl">
          <Owners slug={slug} term={term} initial={owners} />
        </div>
      </PageBody>
    </>
  );
}
