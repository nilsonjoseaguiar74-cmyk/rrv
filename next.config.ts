import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const apiOrigin = (process.env.VERIFY_API_ORIGIN || "http://127.0.0.1:3200").replace(/\/$/, "");
    return [
      {
        source: "/api/verify/:path*",
        destination: `${apiOrigin}/api/verify/:path*`,
      },
      {
        source: "/api/admin/verify/:path*",
        destination: `${apiOrigin}/api/admin/verify/:path*`,
      },
    ];
  },
};

export default nextConfig;
