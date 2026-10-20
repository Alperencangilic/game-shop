// Money is stored in cents
export function formatCents(cents) {
  return `$${(cents / 100).toFixed(2)}`;
}
