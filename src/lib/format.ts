export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatCompactCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatLiters(value: number) {
  return `${new Intl.NumberFormat("en-IN").format(value)} L`;
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-IN").format(value);
}
