export function formatINR(amount: number): string {
  return "₹" + amount.toLocaleString("en-IN");
}

export function roundToTen(amount: number): number {
  return Math.round(amount / 10) * 10;
}
