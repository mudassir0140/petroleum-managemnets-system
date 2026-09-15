"use client";

import Link from "next/link";

export function LoginMenu({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <Link
        href="/auth/login"
        className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700 dark:bg-blue-600 dark:hover:bg-blue-700"
      >
        Login
      </Link>
    </div>
  );
}
