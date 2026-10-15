"use client";

import { LOCATION_LABELS, type Location, type LocationField } from "@/lib/location/fields";

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white";

const PLACEHOLDERS: Record<LocationField, string> = {
  country: "e.g., Pakistan",
  province: "e.g., Punjab or Sindh",
  district: "e.g., Lahore",
  city: "e.g., Lahore",
  address: "Street, area, landmark",
};

// The location inputs used by the supplier and pump forms. Every field listed in `fields` is required.
export function LocationFields({
  values,
  onChange,
  fields,
}: {
  values: Location;
  onChange: (field: LocationField, value: string) => void;
  fields: readonly LocationField[];
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {fields.map((field) => (
        <label key={field} className={`block text-sm font-medium text-slate-700 dark:text-slate-300 ${field === "address" ? "sm:col-span-2" : ""}`}>
          {LOCATION_LABELS[field].en} / {LOCATION_LABELS[field].ur} *
          <input
            type="text"
            required
            maxLength={field === "address" ? 300 : 200}
            value={values[field]}
            onChange={(e) => onChange(field, e.target.value)}
            placeholder={PLACEHOLDERS[field]}
            className={inputClass}
          />
        </label>
      ))}
    </div>
  );
}
