"use client";

import { IconSearch } from "@/components/icons";

export function SearchInput({
  value,
  onChange,
  placeholder = "Search…",
  className = "",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      <IconSearch size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-border-subtle bg-surface-1 py-2 pl-9 pr-3 text-sm text-ink-primary placeholder:text-ink-muted focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
      />
    </div>
  );
}

export function Select({
  value,
  onChange,
  options,
  className = "",
}: {
  value: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
  className?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`rounded-lg border border-border-subtle bg-surface-1 px-3 py-2 text-sm text-ink-primary focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100 ${className}`}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
