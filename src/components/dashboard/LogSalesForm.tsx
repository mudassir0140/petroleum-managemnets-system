"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { IconX } from "@/components/icons";
import { formatCurrency, formatLitres, titleCase } from "@/lib/format";
import type { DailySales, Shift } from "@/lib/types";

const SHIFTS: Shift[] = ["morning", "evening", "night"];

function emptyForm() {
  return { shift: "morning" as Shift, petrolLitres: "", dieselLitres: "", cashRevenue: "", cardRevenue: "" };
}

export function LogSalesForm({ today }: { today: DailySales }) {
  const router = useRouter();
  const [form, setForm] = useState(emptyForm());
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deletingShift, setDeletingShift] = useState<Shift | null>(null);

  const loggedShifts = new Set(today.shifts.map((s) => s.shift));
  const remainingShifts = SHIFTS.filter((s) => !loggedShifts.has(s));

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    const petrolLitres = Number(form.petrolLitres) || 0;
    const dieselLitres = Number(form.dieselLitres) || 0;
    const cashRevenue = Number(form.cashRevenue) || 0;
    const cardRevenue = Number(form.cardRevenue) || 0;

    if (petrolLitres === 0 && dieselLitres === 0 && cashRevenue === 0 && cardRevenue === 0) {
      setError("Enter at least one non-zero value");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/pump-owner/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ shift: form.shift, petrolLitres, dieselLitres, cashRevenue, cardRevenue }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to log sales");
        return;
      }
      setForm(emptyForm());
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to log sales");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(shift: Shift) {
    if (!window.confirm(`Remove today's ${titleCase(shift)} shift entry?`)) return;
    setDeletingShift(shift);
    try {
      const res = await fetch(`/api/pump-owner/sales?date=${today.date}&shift=${shift}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to delete entry");
        return;
      }
      router.refresh();
    } finally {
      setDeletingShift(null);
    }
  }

  return (
    <Card>
      <CardHeader title="Log today's shift sales" subtitle="Enter each shift's totals once it closes — this is what powers your Daily / Weekly / Monthly sales." />

      {today.shifts.length > 0 && (
        <div className="mb-4 space-y-2">
          {today.shifts.map((s) => (
            <div key={s.shift} className="flex items-center justify-between gap-3 rounded-xl border border-border-subtle p-3 text-sm">
              <div>
                <p className="font-medium text-ink-primary">{titleCase(s.shift)}</p>
                <p className="text-xs text-ink-muted">
                  {formatLitres(s.petrolLitres)} petrol · {formatLitres(s.dieselLitres)} diesel · {formatCurrency(s.revenue)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(s.shift)}
                disabled={deletingShift === s.shift}
                aria-label={`Remove ${s.shift} shift entry`}
                className="rounded-lg p-1.5 text-ink-muted transition-colors hover:bg-surface-3 hover:text-[color:var(--status-critical)] disabled:opacity-50"
              >
                <IconX size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {remainingShifts.length === 0 ? (
        <p className="text-xs text-ink-muted">All shifts logged for today.</p>
      ) : (
        <form className="space-y-3" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-lg bg-[color-mix(in_srgb,var(--status-critical)_10%,transparent)] p-3 text-sm text-[color:var(--status-critical)]">
              {error}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-medium text-ink-secondary">Shift</label>
              <select
                value={form.shift}
                onChange={(e) => setForm((f) => ({ ...f, shift: e.target.value as Shift }))}
                className="mt-1 w-full rounded-lg border border-border-subtle bg-surface-1 px-2.5 py-2 text-sm text-ink-primary outline-none focus:border-brand-500"
              >
                {remainingShifts.map((s) => (
                  <option key={s} value={s}>{titleCase(s)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-secondary">Petrol (L)</label>
              <input
                type="number"
                min={0}
                step="0.1"
                value={form.petrolLitres}
                onChange={(e) => setForm((f) => ({ ...f, petrolLitres: e.target.value }))}
                placeholder="0"
                className="mt-1 w-full rounded-lg border border-border-subtle bg-surface-1 px-2.5 py-2 text-sm text-ink-primary outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-secondary">Diesel (L)</label>
              <input
                type="number"
                min={0}
                step="0.1"
                value={form.dieselLitres}
                onChange={(e) => setForm((f) => ({ ...f, dieselLitres: e.target.value }))}
                placeholder="0"
                className="mt-1 w-full rounded-lg border border-border-subtle bg-surface-1 px-2.5 py-2 text-sm text-ink-primary outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-secondary">Cash (Rs.)</label>
              <input
                type="number"
                min={0}
                value={form.cashRevenue}
                onChange={(e) => setForm((f) => ({ ...f, cashRevenue: e.target.value }))}
                placeholder="0"
                className="mt-1 w-full rounded-lg border border-border-subtle bg-surface-1 px-2.5 py-2 text-sm text-ink-primary outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-secondary">Card (Rs.)</label>
              <input
                type="number"
                min={0}
                value={form.cardRevenue}
                onChange={(e) => setForm((f) => ({ ...f, cardRevenue: e.target.value }))}
                placeholder="0"
                className="mt-1 w-full rounded-lg border border-border-subtle bg-surface-1 px-2.5 py-2 text-sm text-ink-primary outline-none focus:border-brand-500"
              />
            </div>
          </div>
          <Button type="submit" variant="primary" disabled={submitting}>
            {submitting ? "Saving…" : "Save shift sales"}
          </Button>
        </form>
      )}
    </Card>
  );
}
