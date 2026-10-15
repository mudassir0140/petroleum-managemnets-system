"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Cancels one of the pump's orders. The server frees the truck unless it has another accepted trip.
export function CancelOrderButton({ orderId, status }: { orderId: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (status === "completed" || status === "cancelled") return null;

  async function cancel() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/pumpadmin/orders/${orderId}/cancel`, { method: "POST", credentials: "include", cache: "no-store" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Failed to cancel the order");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-1">
      <button
        type="button"
        disabled={busy}
        onClick={cancel}
        className="rounded-lg border border-red-300 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950"
      >
        {busy ? "Cancelling... / منسوخ ہو رہا ہے" : "Cancel order / آرڈر منسوخ کریں"}
      </button>
      {error && <p className="mt-1 text-xs text-red-700 dark:text-red-300">{error}</p>}
    </div>
  );
}
