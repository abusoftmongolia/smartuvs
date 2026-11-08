/** sitemap.xml — нүүр, /business, жагсаалтад харагдах идэвхтэй байгууллагууд */
import type { MetadataRoute } from "next";
import { listPublicTenants } from "@/db/tenant";
import { siteUrl } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  let tenants: { slug: string }[] = [];
  try {
    tenants = await listPublicTenants();
  } catch (e) {
    // DB түр унасан ч sitemap 500 болохгүй
    console.error("sitemap", e);
  }
  return [
    { url: `${base}/`, changeFrequency: "daily", priority: 1 },
    { url: `${base}/business`, changeFrequency: "monthly", priority: 0.6 },
    ...tenants.map((t) => ({ url: `${base}/${t.slug}`, changeFrequency: "weekly" as const, priority: 0.8 })),
  ];
}
