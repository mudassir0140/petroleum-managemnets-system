"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { VoiceInput } from "@/components/ui/VoiceInput";
import { LocationFields } from "@/components/location/LocationFields";
import { EyeIcon, EyeOffIcon, PlusIcon, UsersIcon, XIcon } from "@/components/icons";
import type { SupplierView } from "@/lib/supplier/types";

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white";

function formatAdvance(value: number): string {
  return `PKR ${(Number.isFinite(value) ? value : 0).toLocaleString("en-PK", { maximumFractionDigits: 2 })}`;
}

// The Create Supplier Account button, the form it opens, and the supplier cards below it.
export function SupplierHub() {
  const [suppliers, setSuppliers] = useState<SupplierView[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [showForm, setShowForm] = useState(false);

  async function loadSuppliers() {
    try {
      const response = await fetch("/api/pumpadmin/suppliers", { cache: "no-store", credentials: "include" });
      if (!response.ok) return;
      const data = await response.json();
      setSuppliers(Array.isArray(data) ? data : []);
    } catch {
      // Keep the last list if the refresh fails.
    } finally {
      setLoaded(true);
    }
  }

  useEffect(() => {
    loadSuppliers();
  }, []);

  return (
    <div className="mb-6 space-y-4">
      <div>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600"
        >
          <PlusIcon size={16} />
          Create Supplier Account / سپلائر اکاؤنٹ بنائیں
        </button>
      </div>

      {loaded && suppliers.length === 0 && (
        <Card className="text-center">
          <UsersIcon size={28} className="mx-auto text-slate-400" />
          <p className="mt-2 text-sm font-medium text-slate-900 dark:text-white">No suppliers yet / ابھی کوئی سپلائر نہیں</p>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
            Create a supplier account to send fuel requests. / ایندھن کی درخواست بھیجنے کے لیے سپلائر اکاؤنٹ بنائیں۔
          </p>
        </Card>
      )}

      {suppliers.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {suppliers.map((s) => (
            <Link
              key={s.id}
              href={`/pumpadmin/fuel-orders/${s.id}`}
              className="rounded-xl border border-slate-200 bg-white p-4 transition hover:border-amber-400 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{s.name || "—"}</p>
              <p className="truncate text-xs text-slate-600 dark:text-slate-400">{s.companyName || "—"}</p>
              <p className="truncate text-xs text-slate-500">{s.locationText || "Location not saved / مقام محفوظ نہیں"}</p>
              <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">Advance / ایڈوانس</p>
              <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">{formatAdvance(s.advance)}</p>
            </Link>
          ))}
        </div>
      )}

      {showForm && (
        <SupplierCreateForm
          onClose={() => setShowForm(false)}
          onCreated={() => {
            setShowForm(false);
            loadSuppliers();
          }}
        />
      )}
    </div>
  );
}

function SupplierCreateForm({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ name: "", companyName: "", advance: "", password: "", country: "", province: "", district: "", city: "" });
  const [username, setUsername] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const canPreview = form.name.trim() !== "" && form.companyName.trim() !== "";

  // The username is built on the server from name and company, the same rule used on save.
  useEffect(() => {
    if (!canPreview) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ name: form.name, companyName: form.companyName });
        const response = await fetch(`/api/pumpadmin/suppliers/username?${params.toString()}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const data = await response.json().catch(() => null);
        if (response.ok && typeof data?.username === "string") setUsername(data.username);
      } catch {
        // The preview is optional; the server sets the real username on save.
      }
    }, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [canPreview, form.name, form.companyName]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const response = await fetch("/api/pumpadmin/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: form.name,
          companyName: form.companyName,
          advance: form.advance,
          password: form.password,
          country: form.country,
          province: form.province,
          district: form.district,
          city: form.city,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Failed to create the supplier account");
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[min(92vw,34rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-lg dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Create Supplier Account / سپلائر اکاؤنٹ بنائیں</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800" aria-label="Close / بند کریں">
            <XIcon size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">{error}</div>}

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Name / نام</label>
            <VoiceInput
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Name / نام"
              className={inputClass}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Company Name / کمپنی کا نام</label>
            <VoiceInput
              value={form.companyName}
              onChange={(e) => setForm({ ...form, companyName: e.target.value })}
              placeholder="Company Name / کمپنی کا نام"
              className={inputClass}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Username / یوزر نیم (خودکار)</label>
            <input
              type="text"
              value={canPreview ? username : ""}
              readOnly
              placeholder="Filled from name and company / نام اور کمپنی سے خودکار"
              className={`${inputClass} bg-slate-50 text-slate-600 dark:bg-slate-800/60 dark:text-slate-300`}
            />
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">Location / مقام</p>
            <LocationFields
              values={{ country: form.country, province: form.province, district: form.district, city: form.city, address: "" }}
              onChange={(field, value) => setForm({ ...form, [field]: value })}
              fields={["country", "province", "district", "city"]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Advance (PKR) / ایڈوانس</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.advance}
              onChange={(e) => setForm({ ...form, advance: e.target.value })}
              placeholder="0"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Password / پاس ورڈ</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                minLength={6}
                required
                className={`${inputClass} pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-0 mt-1 flex items-center px-3 text-slate-500 hover:text-slate-700 dark:text-slate-400"
                aria-label={showPassword ? "Hide password / پاس ورڈ چھپائیں" : "Show password / پاس ورڈ دکھائیں"}
              >
                {showPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
              </button>
            </div>
            <p className="mt-1 text-xs text-slate-500">At least 6 characters / کم از کم 6 حروف</p>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
          >
            {saving ? "Saving... / محفوظ ہو رہا ہے" : "Save Supplier / محفوظ کریں"}
          </button>
        </form>
      </div>
    </>
  );
}
