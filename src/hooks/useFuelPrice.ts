"use client";

import { useEffect, useRef, useState } from "react";
import type { FuelPriceState } from "@/lib/types";

const POLL_MS = 5000;

// Polls the Company's read-only price endpoint so this dashboard reflects a
// price change within a few seconds of the Company publishing it — no page
// refresh needed. Falls back silently to the last known price on a failed
// fetch (e.g. a dev-server recompile) instead of showing an error state.
export function useFuelPrice(initial: FuelPriceState) {
  const [price, setPrice] = useState(initial);
  const [justChanged, setJustChanged] = useState(false);
  const flashTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch("/api/fuel-price", { cache: "no-store" });
        if (!res.ok) return;
        const next: FuelPriceState = await res.json();
        if (cancelled) return;
        setPrice((prev) => {
          if (prev.updatedAt !== next.updatedAt) {
            setJustChanged(true);
            if (flashTimeout.current) clearTimeout(flashTimeout.current);
            flashTimeout.current = setTimeout(() => setJustChanged(false), 2500);
          }
          return next;
        });
      } catch {
        // Ignore transient network errors; next poll will retry.
      }
    }

    const interval = setInterval(poll, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
      if (flashTimeout.current) clearTimeout(flashTimeout.current);
    };
  }, []);

  return { price, justChanged };
}
