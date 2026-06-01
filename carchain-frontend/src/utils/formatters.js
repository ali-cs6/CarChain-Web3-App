export function formatPrice(amount) {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatMileage(km) {
  return `${new Intl.NumberFormat("en").format(km)} km`;
}

export function formatDate(dateStr) {
  return new Intl.DateTimeFormat("en-PK", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateStr));
}

export function formatTimestamp(seconds) {
  return formatDate(new Date(seconds * 1000));
}

export function truncateTxId(txId, chars = 16) {
  if (!txId) return "—";
  return `${txId.slice(0, chars)}...`;
}
