"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

// Resizes/re-encodes the selected photo client-side before it ever reaches
// the network — a raw phone-camera photo can be 8-12MB, which is both slow
// to upload and pushes the MongoDB document close to its 16MB limit. Capping
// the longest edge at 1280px and re-encoding as JPEG q0.7 gets a typical
// meter photo down to well under 500KB as base64.
function resizePhoto(file: File, maxDimension = 1280, quality = 0.7): Promise<string> {
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

interface MeterReadingFormProps {
  type: "start" | "end";
  redirectOnSuccess: string;
}

export function MeterReadingForm({ type, redirectOnSuccess }: MeterReadingFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fuelType, setFuelType] = useState<"petrol" | "diesel">("petrol");
  const [reading, setReading] = useState("");
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [photoProcessing, setPhotoProcessing] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setPhotoProcessing(true);
    try {
      const dataUrl = await resizePhoto(file);
      setPhotoDataUrl(dataUrl);
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
      const response = await fetch("/api/meter-readings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, fuelType, reading: readingNumber, photoDataUrl }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to submit meter reading");
      }

      if (type === "end") {
        // End-of-shift also closes out attendance — send them through the
        // real logout so the cookie is cleared consistently with every
        // other role, not just marked in the DB. /employee/logout is a
        // Route Handler (cookie mutation requires that, not a page render),
        // so it needs a real navigation, not router.push()'s client-side
        // page transition.
        window.location.href = "/employee/logout";
      } else {
        router.push(redirectOnSuccess);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Fuel Type *
        </label>
        <select
          value={fuelType}
          onChange={(e) => setFuelType(e.target.value as "petrol" | "diesel")}
          className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          disabled={submitting}
        >
          <option value="petrol">Petrol</option>
          <option value="diesel">Diesel</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Meter Reading *
        </label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={reading}
          onChange={(e) => setReading(e.target.value)}
          placeholder="e.g. 18452.50"
          required
          className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          disabled={submitting}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Meter Photo *
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handlePhotoChange}
          className="mt-1.5 w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-amber-600 file:px-3.5 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-amber-700 dark:text-slate-400"
          disabled={submitting}
        />
        {photoProcessing && (
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Processing photo…</p>
        )}
        {photoDataUrl && !photoProcessing && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoDataUrl}
            alt="Meter reading preview"
            className="mt-3 max-h-48 rounded-lg border border-slate-200 dark:border-slate-700"
          />
        )}
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting || photoProcessing}
        className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
      >
        {submitting
          ? "Submitting..."
          : type === "start"
            ? "Start Shift"
            : "End Shift & Log Out"}
      </button>
    </form>
  );
}
