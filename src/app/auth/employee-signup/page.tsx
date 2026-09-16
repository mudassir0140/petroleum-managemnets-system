"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { findInvitationByEmail, createSignupRequest, checkSignupStatus } from "@/lib/employee/actions";
import { hashPassword } from "@/lib/auth/password";
import { DropletIcon } from "@/components/icons";

export default function EmployeeSignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<"email-check" | "details">("email-check");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [invitationRole, setInvitationRole] = useState("");
  const [invitationName, setInvitationName] = useState("");

  // Check email on mount (if coming from invitation link)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get("email");
    if (emailParam) {
      setEmail(emailParam);
      checkEmail(emailParam);
    }
  }, []);

  async function checkEmail(emailToCheck: string) {
    if (!emailToCheck) {
      setError("Email is required");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const statusCheck = await checkSignupStatus(emailToCheck);

      if (statusCheck.status === "not-invited") {
        setError("Email not found in invitations. Please contact your company owner.");
        return;
      }

      if (statusCheck.status === "rejected") {
        setError(statusCheck.message || "Your invitation was rejected");
        return;
      }

      if (statusCheck.status === "active") {
        setError("This account is already active. Please login.");
        return;
      }

      if (statusCheck.status === "pending") {
        setError("Your signup request is pending admin approval. Please wait.");
        return;
      }

      // Email is valid and invitation exists
      const invitation = await findInvitationByEmail(emailToCheck);
      if (invitation) {
        setInvitationRole(invitation.role);
        setInvitationName(invitation.name);
        setStep("details");
      }
    } catch (err) {
      setError("Failed to verify invitation");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (password !== confirmPassword) {
        setError("Passwords do not match");
        setIsLoading(false);
        return;
      }

      if (password.length < 6) {
        setError("Password must be at least 6 characters");
        setIsLoading(false);
        return;
      }

      // Create signup request
      const result = await createSignupRequest(email, invitationRole);

      if (result.success) {
        router.push(
          `/auth/signup-pending?email=${encodeURIComponent(email)}&requestId=${result.requestId}`
        );
      } else {
        setError(result.error || "Failed to create signup request");
      }
    } catch (err) {
      setError("An error occurred");
    } finally {
      setIsLoading(false);
    }
  }

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
          {step === "email-check" ? (
            <>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">Employee Signup</h1>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Enter the email address from your invitation
              </p>

              <form className="mt-6 space-y-4" onSubmit={(e) => {
                e.preventDefault();
                checkEmail(email);
              }}>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                {error && (
                  <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
                >
                  {isLoading ? "Checking..." : "Continue"}
                </button>
              </form>
            </>
          ) : (
            <>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">Complete Your Signup</h1>
              <div className="mt-4 rounded-lg bg-slate-100 p-3 text-sm dark:bg-slate-800">
                <p className="font-medium text-slate-900 dark:text-white">{invitationName}</p>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">{email}</p>
              </div>

              <form className="mt-6 space-y-4" onSubmit={handleSignup}>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Password
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                {error && (
                  <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
                >
                  {isLoading ? "Creating Account..." : "Create Account"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStep("email-check");
                    setPassword("");
                    setConfirmPassword("");
                    setError("");
                  }}
                  className="w-full text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                >
                  Back
                </button>
              </form>
            </>
          )}

          <div className="mt-6 border-t border-slate-200 pt-6 dark:border-slate-800">
            <p className="text-center text-sm text-slate-600 dark:text-slate-400">
              Already have an account?{" "}
              <Link
                href="/auth/login"
                className="font-semibold text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300"
              >
                Login here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
