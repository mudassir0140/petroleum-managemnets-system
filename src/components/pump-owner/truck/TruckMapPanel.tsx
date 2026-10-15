"use client";

import dynamic from "next/dynamic";

// The map code runs only in the browser, so the server render never touches Leaflet or window.
export const TruckMapPanel = dynamic(() => import("./TruckMap"), {
  ssr: false,
  loading: () => <div className="h-40 w-full animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />,
});
