"use client";

import Link from "next/link";
import { DropletIcon } from "@/components/icons";

export default function SignupPendingPage() {
  return (
    <div className="flex min-h-full flex-1 items-center justify-center bg-slate-50 px-4 py-16 dark:bg-slate-950">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white">
            <DropletIcon className="size-5" />
          </span>
          <span className="text-base font-bold text-slate-900 dark:text-white">PetroManage</span>
        </Link>

        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex size-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900">
            <svg
              className="size-6 text-amber-600 dark:text-amber-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          <h1 className="mt-4 text-2xl font-bold text-slate-900 dark:text-white">Pending Approval</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Your signup request has been submitted and is waiting for admin approval. You'll receive
            an email notification once your account has been reviewed.
          </p>

          <div className="mt-6 rounded-lg bg-amber-50 p-4 dark:bg-amber-950">
            <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
              What happens next?
            </p>
            <ul className="mt-2 space-y-2 text-xs text-amber-800 dark:text-amber-200">
              <li>✓ Admin will review your account details</li>
              <li>✓ You'll be notified via email of the decision</li>
              <li>✓ Once approved, you can login and access your dashboard</li>
            </ul>
          </div>

          <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
            Questions?{" "}
            <a href="mailto:support@petromanage.com" className="font-semibold text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300">
              Contact support
            </a>
          </p>

          <Link
            href="/"
            className="mt-6 block w-full rounded-lg bg-slate-900 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
