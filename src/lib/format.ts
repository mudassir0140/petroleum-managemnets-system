const grouping = new Intl.NumberFormat("en-US");
const compact = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export function formatCurrency(amount: number): string {
  return `Rs ${grouping.format(Math.round(amount))}`;
}

export function formatCurrencyCompact(amount: number): string {
  return `Rs ${compact.format(amount)}`;
}

export function formatLitres(litres: number): string {
  return `${grouping.format(Math.round(litres))} L`;
}

export function formatLitresCompact(litres: number): string {
  return `${compact.format(litres)} L`;
}

export function formatNumber(value: number): string {
  return grouping.format(Math.round(value));
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
  });
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateTime(iso: string): string {
  return `${formatDate(iso)}, ${formatTime(iso)}`;
}

export function formatRelativeToNow(iso: string): string {
  const diffMs = new Date(iso).getTime() - Date.now();
  const diffMin = Math.round(diffMs / 60000);
  if (Math.abs(diffMin) < 1) return "just now";
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  if (Math.abs(diffMin) < 60) return rtf.format(diffMin, "minute");
  const diffHr = Math.round(diffMin / 60);
  if (Math.abs(diffHr) < 24) return rtf.format(diffHr, "hour");
  const diffDay = Math.round(diffHr / 24);
  return rtf.format(diffDay, "day");
}

export function formatPumpAddress(pump: { location: string; city: string }): string {
  return [pump.location, pump.city].filter(Boolean).join(", ");
}

export function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function titleCase(value: string): string {
  return value
    .split("_")
    .map((word) => capitalize(word))
    .join(" ");
}
