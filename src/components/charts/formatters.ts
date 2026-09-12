import { formatCurrency, formatCurrencyCompact, formatLitres, formatLitresCompact, formatNumber } from "@/lib/format";

// Server components can't pass function props to client components (chart
// components below are all 'use client'), so charts take a string key
// instead of a formatter function and resolve it internally.
export const CHART_FORMATTERS = {
  number: formatNumber,
  currency: formatCurrency,
  currencyCompact: formatCurrencyCompact,
  litres: formatLitres,
  litresCompact: formatLitresCompact,
} as const;

export type ChartFormat = keyof typeof CHART_FORMATTERS;
