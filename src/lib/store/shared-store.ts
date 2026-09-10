"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const PREFIX = "petromanage:";

function readValue<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeValue<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent(`shared-store:${key}`));
}

/**
 * localStorage-backed state that stays in sync across every component using
 * the same key in this tab (CustomEvent) and across other tabs of the same
 * browser (native "storage" event) - used to simulate a live backend for the
 * demo, e.g. fuel prices published by the Owner reaching the Manager instantly.
 */
export function useSharedState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const initialRef = useRef(initial);

  useEffect(() => {
    initialRef.current = initial;
  });

  useEffect(() => {
    setValue(readValue(key, initialRef.current));

    function onLocalUpdate() {
      setValue(readValue(key, initialRef.current));
    }
    function onStorage(event: StorageEvent) {
      if (event.key === PREFIX + key) onLocalUpdate();
    }

    window.addEventListener(`shared-store:${key}`, onLocalUpdate);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(`shared-store:${key}`, onLocalUpdate);
      window.removeEventListener("storage", onStorage);
    };
  }, [key]);

  const update = useCallback(
    (updater: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const next =
          typeof updater === "function" ? (updater as (prev: T) => T)(prev) : updater;
        writeValue(key, next);
        return next;
      });
    },
    [key],
  );

  return [value, update] as const;
}
