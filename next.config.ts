import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // cag.smartuvs.mn → tsag.smartuvs.mn дамжуулалтыг Vercel domain redirect-ээр хийнэ (кодоор биш).
  poweredByHeader: false,
  async headers() {
    // Фонтын нэрэнд хувилбар орсон (inter-latin-5.3.0.woff2) тул 1 жил кэшлэнэ
    return [{ source: "/fonts/:file*", headers: [{ key: "cache-control", value: "public, max-age=31536000, immutable" }] }];
  },
};

export default nextConfig;
