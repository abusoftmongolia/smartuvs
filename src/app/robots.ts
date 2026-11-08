/** robots.txt — нийтийн захиалгын хуудсуудыг индексжүүлнэ; самбар, manage, API-г үгүй. admin хост бүхэлдээ хаалттай. */
import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { isAdminHost } from "@/lib/host-routing";
import { siteUrl } from "@/lib/site";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const host = (await headers()).get("host");
  if (isAdminHost(host, process.env.ADMIN_HOST ?? "admin.smartuvs.mn")) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/dashboard", "/manage", "/api", "/admin", "/platform", "/login", "/signup"] },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
