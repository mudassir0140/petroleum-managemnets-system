"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { DropletIcon, CheckCircleIcon } from "@/components/icons";

function SignupPendingContent() {
  const searchParams = useSearchParams();
  const [type, setType] = useState("employee");

  useEffect(() => {
    setType(searchParams.get("type") || "employee");
  }, [searchParams]);

  return (
    <div className="flex min-h-full flex-1 items-center justify-center bg-slate-50 px-4 py-16 dark:bg-slate-950">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white">
            <DropletIcon className="size-5" />
          </span>
          <span className="text-base font-bold text-slate-900 dark:text-white">
            PetroManage
          </span>
        </Link>

        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex justify-center mb-6">
            <CheckCircleIcon className="size-12 text-amber-600 dark:text-amber-400" />
          </div>

          <h1 className="text-xl font-bold text-center text-slate-900 dark:text-white">
            Signup Request Submitted
          </h1>

          <p className="mt-4 text-center text-sm text-slate-600 dark:text-slate-400">
            {type === "pump-owner"
              ? "Thank you for signing up as a Pump Owner. Your account request has been submitted for admin approval."
              : "Thank you for signing up. Your account request has been submitted for admin approval."}
          </p>

          <div className="mt-6 rounded-lg bg-blue-50 p-4 dark:bg-blue-900/30">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
              📋 What happens next?
            </p>
            <ul className="mt-3 space-y-2 text-sm text-blue-800 dark:text-blue-200">
              <li className="flex gap-2">
                <span>✓</span>
                <span>Our admin team will review your request</span>
              </li>
              <li className="flex gap-2">
                <span>✓</span>
                <span>You'll receive confirmation once approved</span>
              </li>
              <li className="flex gap-2">
                <span>✓</span>
                <span>You can then log in with your email and access your account</span>
              </li>
            </ul>
          </div>

          <div className="mt-6 border-t border-slate-200 pt-6 dark:border-slate-800">
            <p className="text-center text-sm text-slate-600 dark:text-slate-400">
              Have an account already?{" "}
              <Link
                href="/auth/login"
                className="font-semibold text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300"
              >
                Log in here
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function SignupPendingApprovalPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-full flex-1 items-center justify-center bg-slate-50 px-4 py-16 dark:bg-slate-950">
          <div className="text-center">
            <p className="text-slate-600 dark:text-slate-400">Loading...</p>
          </div>
        </div>
      }
    >
      <SignupPendingContent />
    </Suspense>
  );
}
