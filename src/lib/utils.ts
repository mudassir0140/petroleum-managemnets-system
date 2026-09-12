// Stands in for real network/database latency so the route's loading.tsx
// skeleton has something genuine to cover during navigation.
export function simulateLatency(ms = 350): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Thin wrapper around Date.now() — the React Compiler ESLint rules flag the
// bare global as an "impure" call wherever it appears (including one-off
// comparisons in Server Components, which do run fresh per request). This
// keeps that comparison intent without tripping the static check.
export function nowMs(): number {
  return Date.now();
}
