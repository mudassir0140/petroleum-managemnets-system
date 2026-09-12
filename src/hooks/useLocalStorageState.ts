"use client";

import { useEffect, useState } from "react";

// Lazily reads from localStorage on mount (after hydration) so SSR and the
// first client render agree, then persists every update.
export function useLocalStorageState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // localStorage only exists on the client, so the stored value can only be
    // applied post-mount — reading it during render would desync SSR output
    // from the client's first paint. This one-time sync-from-storage is the
    // deliberate exception to "don't setState in an effect".
    try {
      const raw = window.localStorage.getItem(key);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setValue(JSON.parse(raw));
    } catch {
      // Ignore malformed/blocked storage; fall back to initial value.
    } finally {
      setHydrated(true);
    }
  }, [key]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Ignore quota/blocked storage errors — state still works in-memory.
    }
  }, [key, value, hydrated]);

  return [value, setValue] as const;
}
