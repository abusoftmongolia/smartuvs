import type { Metadata, Viewport } from "next";
import { preload } from "react-dom";
// Фонт: globals.css-ийн @font-face (public/fonts) — Google Fonts руу хандахгүй
import "./globals.css";

/** Бараг бүх хуудсанд хэрэглэгдэх subset-үүд (латин тоо/цэг, кирилл, Ө/Ү) — эрт татна */
const FONT_PRELOAD = ["latin", "cyrillic", "cyrillic-ext"].map((s) => `/fonts/inter-${s}-5.3.0.woff2`);

export const metadata: Metadata = {
  title: { default: "Цаг захиалга — SmartUvs", template: "%s · Цаг захиалга" },
  description: "Үсчин, гоо сайхан, авто угаалга, эмнэлэгт онлайнаар цаг захиалах.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://tsag.smartuvs.mn"),
};

export const viewport: Viewport = { themeColor: "#f5a800", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  for (const href of FONT_PRELOAD) preload(href, { as: "font", type: "font/woff2", crossOrigin: "anonymous" });
  return (
    <html lang="mn">
      <body className="min-h-dvh font-sans antialiased">{children}</body>
    </html>
  );
}
