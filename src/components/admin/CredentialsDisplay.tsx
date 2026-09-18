"use client";

import { useState } from "react";

interface CredentialsDisplayProps {
  email: string;
  password: string;
  accountType?: string;
}

export function CredentialsDisplay({ email, password, accountType = "Account" }: CredentialsDisplayProps) {
  const [showPassword, setShowPassword] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">
          {accountType} Login Credentials
        </p>
      </div>

      <div className="space-y-3 rounded bg-white p-3 dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Email</p>
            <p className="font-mono text-sm text-slate-900 dark:text-white">{email}</p>
          </div>
          <button
            onClick={() => copyToClipboard(email)}
            className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Copy
          </button>
        </div>

        <div className="border-t border-slate-200 dark:border-slate-700"></div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Password</p>
            <p className="font-mono text-sm text-slate-900 dark:text-white">
              {showPassword ? password : "••••••••"}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowPassword(!showPassword)}
              className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
            {showPassword && (
              <button
                onClick={() => copyToClipboard(password)}
                className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Copy
              </button>
            )}
          </div>
        </div>
      </div>

      <p className="mt-3 text-xs text-blue-700 dark:text-blue-300">
        ℹ️ Share these credentials with the user. They can log in immediately.
      </p>
    </div>
  );
}
