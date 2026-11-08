import type { NextConfig } from "next";

/** Бүх хуудсанд: clickjacking, MIME sniffing, referrer, хөтчийн эрхийг хязгаарлана. HSTS — зөвхөн https. */
const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  // Script-ийн CSP-г Next-ийн inline script-ийн улмаас (nonce-гүй) энд хязгаарлахгүй — эрсдэл багатай директивууд л
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'" },
];

const nextConfig: NextConfig = {
  // cag.smartuvs.mn → tsag.smartuvs.mn дамжуулалтыг Vercel domain redirect-ээр хийнэ (кодоор биш).
  poweredByHeader: false,
  // Ажиллаж буй `next dev`-ийн .next-ийг build дарахгүйн тулд: NEXT_DIST_DIR=.next-build npm run build
  distDir: process.env.NEXT_DIST_DIR || ".next",
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // Фонтын нэрэнд хувилбар орсон (inter-latin-5.3.0.woff2) тул 1 жил кэшлэнэ
      { source: "/fonts/:file*", headers: [{ key: "cache-control", value: "public, max-age=31536000, immutable" }] },
    ];
  },
};

export default nextConfig;
