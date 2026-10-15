"use client";

// Shown when a page throws, for example when the database is unreachable.
// Only a generic message is shown, so no connection details reach the browser.
export default function AppError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-lg p-6 text-center">
      <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Something went wrong</h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        This page could not load its data. The database may be temporarily unreachable.
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="mt-4 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600"
      >
        Try again
      </button>
    </div>
  );
}
