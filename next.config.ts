import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async redirects() {
    // The admin login page moved to /developer. Old links to /admin/login are sent there.
    return [
      {
        source: "/admin/login",
        destination: "/developer",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
