"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { ChangePasswordForm } from "@/components/account/ChangePasswordForm";

// Change Password for the signed-in pump owner, opened from the Profile panel.
// Rendered through a portal: the header uses backdrop-filter, which would otherwise keep this
// overlay inside the header's box instead of covering the whole dashboard.
export function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="change-password-title"
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-lg dark:border-slate-800 dark:bg-slate-900"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Pump owner / پمپ مالک</p>
            <h2 id="change-password-title" className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
              Change Password / پاس ورڈ تبدیل کریں
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            ✕
          </button>
        </div>
        <ChangePasswordForm role="pump-owner" embedded />
      </div>
    </div>,
    document.body
  );
}
