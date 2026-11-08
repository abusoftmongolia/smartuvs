/** Сайтын үндсэн хаяг (төгсгөлийн / -гүй) */
export const siteUrl = () => (process.env.NEXT_PUBLIC_SITE_URL ?? "https://tsag.smartuvs.mn").replace(/\/$/, "");
