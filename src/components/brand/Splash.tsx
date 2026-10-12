"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

const STORAGE_KEY = "petromanage-splash-seen";
const TOTAL_MS = 2500;
const FADE_MS = 400;

// Shown once per browser session. It is decided inside useEffect so the server
// and first client render both output nothing, which avoids a hydration error.
// The overlay ignores pointer input, so login and the dashboards stay usable.
export function Splash() {
  const [phase, setPhase] = useState<"hidden" | "in" | "out">("hidden");

  useEffect(() => {
    try {
      if (sessionStorage.getItem(STORAGE_KEY) === "1") return;
    } catch {
      // Storage can be blocked; the splash then simply shows on each full load.
    }

    setPhase("in");
    const fadeOut = setTimeout(() => setPhase("out"), TOTAL_MS - FADE_MS);
    const finish = setTimeout(() => {
      setPhase("hidden");
      try {
        sessionStorage.setItem(STORAGE_KEY, "1");
      } catch {
        // Ignored: see the note above.
      }
    }, TOTAL_MS);

    return () => {
      clearTimeout(fadeOut);
      clearTimeout(finish);
    };
  }, []);

  if (phase === "hidden") return null;

  return (
    <div
      aria-hidden
      className={`pointer-events-none fixed inset-0 z-[100] flex items-center justify-center bg-[#ffffff] ${
        phase === "in" ? "animate-splash-in" : "animate-splash-out"
      }`}
    >
      {/* The only logo file is 64x43px, so it is shown at that exact size.
          Scaling it up is what made it blurry. unoptimized serves the original file as-is. */}
      <Image
        src="/logo/logo.png"
        alt="Why Ideas Only logo"
        width={64}
        height={43}
        priority
        unoptimized
      />
    </div>
  );
}
