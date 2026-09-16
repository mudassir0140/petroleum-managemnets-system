"use client";

import { useState } from "react";

interface PumpDetailModalProps {
  pump: any | null;
  isOpen: boolean;
  onClose: () => void;
  onPasswordReset: (pumpId: string) => Promise<void>;
}

export function PumpDetailModal({
  pump,
  isOpen,
  onClose,
  onPasswordReset,
}: PumpDetailModalProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetPassword, setResetPassword] = useState<string | null>(null);

  if (!isOpen || !pump) return null;

  const handleResetPassword = async () => {
    setResetLoading(true);
    try {
      await onPasswordReset(pump.pumpId);
      setResetPassword(`${pump.ownerName}123`);
    } catch (error) {
      console.error("Failed to reset password:", error);
      alert("Failed to reset password");
    } finally {
      setResetLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 dark:bg-slate-900">
        <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
          Pump Details
        </h2>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Pump Name
            </label>
            <p className="mt-1 text-slate-900 dark:text-white">{pump.pumpName}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Owner Name
            </label>
            <p className="mt-1 text-slate-900 dark:text-white">{pump.ownerName}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Owner Email (Login Credentials)
            </label>
            <div className="mt-1 flex items-center gap-2 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 font-mono text-sm dark:border-slate-600 dark:bg-slate-800">
              <span className="flex-1 text-slate-900 dark:text-white">{pump.ownerEmail}</span>
              <button
                onClick={() => copyToClipboard(pump.ownerEmail)}
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
              >
                Copy
              </button>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Status
            </label>
            <p className="mt-1">
              <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                {pump.status}
              </span>
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Current Password
              </label>
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            <p className="mt-1 font-mono text-sm text-slate-900 dark:text-white">
              {showPassword ? pump.password : "••••••••"}
            </p>
          </div>

          {resetPassword && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-900/30 dark:bg-green-900/10">
              <p className="mb-2 text-xs font-semibold text-green-900 dark:text-green-200">
                ✓ Password Reset Successfully
              </p>
              <div className="space-y-2">
                <p className="text-xs text-green-800 dark:text-green-300">
                  New Password:
                </p>
                <div className="flex items-center gap-2 rounded bg-white px-2 py-1 font-mono text-sm dark:bg-slate-800">
                  <span className="flex-1 text-slate-900 dark:text-white">{resetPassword}</span>
                  <button
                    onClick={() => copyToClipboard(resetPassword)}
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                  >
                    Copy
                  </button>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={handleResetPassword}
            disabled={resetLoading}
            className="w-full rounded-lg border border-blue-300 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 disabled:opacity-50 dark:border-blue-900/30 dark:bg-blue-900/10 dark:text-blue-300 dark:hover:bg-blue-900/20"
          >
            {resetLoading ? "Resetting..." : "Reset Password"}
          </button>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg bg-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-300 dark:bg-slate-700 dark:text-white dark:hover:bg-slate-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
