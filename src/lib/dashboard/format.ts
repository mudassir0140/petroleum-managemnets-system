export function formatCurrency(amount: number): string {
  return `Rs. ${amount.toLocaleString("en-PK")}`;
}

export function formatCurrencyCompact(amount: number): string {
  if (Math.abs(amount) >= 1_000_000) {
    return `Rs. ${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(amount) >= 1_000) {
    return `Rs. ${(amount / 1_000).toFixed(0)}K`;
  }
  return formatCurrency(amount);
}

export function formatLiters(liters: number): string {
  return `${liters.toLocaleString("en-PK")} L`;
}
