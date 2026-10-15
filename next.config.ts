import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // After Logout, Back must not show a cached admin dashboard.
  async headers() {
    const noStore = [{ key: "Cache-Control", value: "no-store, no-cache, must-revalidate, private" }];
    return [
      { source: "/admin/:path*", headers: noStore },
      { source: "/developer", headers: noStore },
      { source: "/dashboard/attendant/:path*", headers: noStore },
      { source: "/attendant/:path*", headers: noStore },
      { source: "/dashboard/:path*", headers: noStore },
      { source: "/pumpadmin/:path*", headers: noStore },
      { source: "/khata-client/:path*", headers: noStore },
      { source: "/supplier/:path*", headers: noStore },
      { source: "/truck/:path*", headers: noStore },
    ];
  },
};

export default nextConfig;
