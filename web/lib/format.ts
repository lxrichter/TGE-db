export function formatCount(value: number | null | undefined) {
  return Number(value || 0).toLocaleString(undefined, {
    maximumFractionDigits: 0,
  });
}

export function formatMw(value: number | null | undefined, digits = 1) {
  return Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}