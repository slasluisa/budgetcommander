export function formatUsd(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function usdToCents(amount: number) {
  return Math.round(amount * 100);
}

export function centsToUsd(cents: number) {
  return cents / 100;
}

export function formatUsdFromCents(cents: number) {
  return formatUsd(centsToUsd(cents));
}
