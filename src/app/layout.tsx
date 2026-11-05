import type { Metadata, Viewport } from "next";
// Фонтыг өөр дээрээ байрлуулна (кирилл + латин) — build үед Google Fonts руу хандахгүй
import "@fontsource-variable/inter/index.css";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Цаг захиалга — SmartUvs", template: "%s · Цаг захиалга" },
  description: "Үсчин, гоо сайхан, авто угаалга, эмнэлэгт онлайнаар цаг захиалах.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://tsag.smartuvs.mn"),
};

export const viewport: Viewport = { themeColor: "#f5a800", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="mn">
      <body className="min-h-dvh font-sans antialiased">{children}</body>
    </html>
  );
}
