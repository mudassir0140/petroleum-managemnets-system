import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // After Logout, Back must not show a cached admin dashboard.
  async headers() {
    const noStore = [{ key: "Cache-Control", value: "no-store, no-cache, must-revalidate, private" }];
    return [
      { source: "/admin/:path*", headers: noStore },
      { source: "/developer", headers: noStore },
    ];
  },
};

export default nextConfig;
