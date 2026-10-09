"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { BackButton } from "@/components/dashboard/BackButton";
import { IconSearch } from "@/components/icons";

async function resizePhoto(file: File, maxDimension = 1280, quality = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read the photo"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Could not load the photo"));
      img.onload = () => {
        const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas not supported"));
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export default function EndShiftPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [reading, setReading] = useState("");
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoProcessing, setPhotoProcessing] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [calculationResult, setCalculationResult] = useState<{
    litresSold: number;
    amountDue: number;
  } | null>(null);

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setPhotoProcessing(true);
    try {
      const dataUrl = await resizePhoto(file);
      setPhotoDataUrl(dataUrl);
      setPhotoPreview(dataUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process photo");
    } finally {
      setPhotoProcessing(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const readingNumber = Number(reading);
    if (!reading || Number.isNaN(readingNumber) || readingNumber < 0) {
      setError("Enter a valid meter reading");
      return;
    }
    if (!photoDataUrl) {
      setError("A photo of the meter is required");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/attendant/shift/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endReading: readingNumber,
          photoDataUrl,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to end shift");
      }

      setCalculationResult({
        litresSold: data.litresSold,
        amountDue: data.amountDue,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setSubmitting(false);
    }
  }

  if (calculationResult) {
    return (
      <div>
        <BackButton />
        <PageHeader title="Shift Summary" description="Confirm and close your shift" />

        <Card className="max-w-2xl">
          <CardHeader title="Shift Calculation" subtitle="Review the calculated litres and amount due" />
          <div className="space-y-6 p-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-surface-3 p-4">
                <p className="text-xs text-ink-muted mb-1">Litres Sold / فروخت شدہ لیٹر</p>
                <p className="text-2xl font-bold text-ink-primary">{calculationResult.litresSold.toFixed(2)} L</p>
              </div>
              <div className="rounded-lg bg-surface-3 p-4">
                <p className="text-xs text-ink-muted mb-1">Amount Due / واجب الادا رقم</p>
                <p className="text-2xl font-bold text-green-600">Rs {calculationResult.amountDue.toFixed(0)}</p>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 dark:bg-blue-950">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                Hand over <strong>Rs {calculationResult.amountDue.toFixed(0)}</strong> to the pump owner to complete the shift.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => router.push("/attendant/dashboard")}
                className="flex-1 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600"
              >
                Close Shift
              </button>
              <button
                onClick={() => {
                  setCalculationResult(null);
                  setReading("");
                  setPhotoDataUrl(null);
                  setPhotoPreview(null);
                }}
                className="flex-1 rounded-lg border border-border-subtle px-4 py-2.5 text-sm font-semibold text-ink-primary transition hover:bg-surface-3"
              >
                Back
              </button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <BackButton />
      <PageHeader title="End Shift" description="Record your end meter reading and take a photo to close your shift." />

      <Card className="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          <div>
            <label className="block text-sm font-medium text-ink-primary mb-2">
              End Meter Reading / آخری پڑھائی
            </label>
            <input
              type="number"
              required
              value={reading}
              onChange={(e) => setReading(e.target.value)}
              placeholder="e.g., 1450.25"
              step="0.01"
              min="0"
              className="w-full rounded-lg border border-border-subtle px-3.5 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-primary mb-2">
              Meter Photo / میٹر کی تصویر
            </label>
            {photoPreview ? (
              <div className="space-y-3">
                <div className="relative aspect-square max-w-xs rounded-lg overflow-hidden bg-surface-3">
                  <img src={photoPreview} alt="Meter reading" className="h-full w-full object-cover" />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPhotoDataUrl(null);
                    setPhotoPreview(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="text-sm text-rose-600 hover:text-rose-700 font-medium"
                >
                  Change Photo
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={photoProcessing}
                className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border-subtle py-8 text-sm font-medium text-ink-muted hover:border-brand-500 hover:text-brand-500 transition disabled:opacity-50"
              >
                <IconSearch size={20} />
                {photoProcessing ? "Processing..." : "Upload Photo"}
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-50"
            >
              {submitting ? "Calculating..." : "Calculate & Continue"}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 rounded-lg border border-border-subtle px-4 py-2.5 text-sm font-semibold text-ink-primary transition hover:bg-surface-3"
            >
              Cancel
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
