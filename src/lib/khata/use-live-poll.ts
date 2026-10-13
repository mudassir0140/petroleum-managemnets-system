"use client";

import { useEffect, useRef } from "react";

// Runs `task` now, then again `intervalMs` after each run finishes. The next
// run is only scheduled once the current one is done, so requests never
// overlap. Stops on unmount, or when `enabled` is false. Changing `deps`
// restarts the loop straight away.
export function useLivePoll(
  task: () => Promise<unknown>,
  intervalMs: number,
  deps: unknown[] = [],
  enabled = true
) {
  const taskRef = useRef(task);

  useEffect(() => {
    taskRef.current = task;
  });

  useEffect(() => {
    if (!enabled) return;

    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function run() {
      try {
        await taskRef.current();
      } catch (err) {
        console.error("Live refresh failed:", err);
      }
      if (active) timer = setTimeout(run, intervalMs);
    }

    run();

    return () => {
      active = false;
      if (timer) clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intervalMs, enabled, ...deps]);
}
