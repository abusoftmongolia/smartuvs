import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // cag.smartuvs.mn → tsag.smartuvs.mn дамжуулалтыг Vercel domain redirect-ээр хийнэ (кодоор биш).
  poweredByHeader: false,
};

export default nextConfig;
