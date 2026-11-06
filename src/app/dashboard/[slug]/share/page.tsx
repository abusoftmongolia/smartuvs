import { PageBody, PageHeader } from "../../PageHeader";
import { Share } from "../settings/Settings";
import { manageContext, siteUrl } from "../settings/data";

export default async function SharePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await manageContext(slug);
  return (
    <>
      <PageHeader title="Хуваалцах / QR" subtitle="Захиалгын холбоос, QR код, хэвлэх A4 постер" />
      <PageBody>
        <div className="max-w-3xl"><Share slug={slug} url={`${siteUrl()}/${slug}`} /></div>
      </PageBody>
    </>
  );
}
