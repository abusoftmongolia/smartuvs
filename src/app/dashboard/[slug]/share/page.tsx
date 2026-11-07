import { qrSvg } from "@/lib/qr";
import { PageBody, PageHeader } from "../../PageHeader";
import { manageContext, siteUrl } from "../settings/data";
import { Share } from "./Share";

export default async function SharePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await manageContext(slug);
  const url = `${siteUrl()}/${slug}`;
  return (
    <>
      <PageHeader title="Хуваалцах / QR" subtitle="Захиалгын холбоос, QR код, хэвлэх A4 постер" />
      <PageBody>
        <div className="max-w-3xl"><Share slug={slug} url={url} qrSvg={await qrSvg(url)} /></div>
      </PageBody>
    </>
  );
}
