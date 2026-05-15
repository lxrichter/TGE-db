export function isBlank(value: unknown): boolean {
  return value === null || value === undefined || String(value).trim() === "";
}

export function parseOptionalNumber(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const num = Number(trimmed);
  return Number.isFinite(num) ? num : NaN;
}

export function isValidPercentage(value: string): boolean {
  const num = parseOptionalNumber(value);
  if (num === null) return true;
  return Number.isFinite(num) && num >= 0 && num <= 100;
}

export function isValidNonNegativeNumber(value: string): boolean {
  const num = parseOptionalNumber(value);
  if (num === null) return true;
  return Number.isFinite(num) && num >= 0;
}

export function isValidDateLike(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;

  const shortDate = /^\d{4}-\d{2}-\d{2}$/;
  const dateTime = /^\d{4}-\d{2}-\d{2}( \d{2}:\d{2}:\d{2})?$/;

  return shortDate.test(trimmed) || dateTime.test(trimmed);
}