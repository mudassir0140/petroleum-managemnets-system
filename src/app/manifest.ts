import type { MetadataRoute } from "next";

// Lets the app be installed to the home screen. Offline use is provided by public/sw.js.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PetroManage | Petroleum Management System",
    short_name: "PetroManage",
    description:
      "PetroManage unifies tank inventory, fuel distribution, station sales, and regulatory compliance in one real-time petroleum management platform.",
    start_url: "/",
    display: "standalone",
    background_color: "#f1f5f9",
    theme_color: "#1e293b",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
