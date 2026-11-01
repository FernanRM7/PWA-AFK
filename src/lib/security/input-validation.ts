export const MAX_INSPECTION_LOCATION_LENGTH = 120;
export const MAX_INSPECTION_INSPECTOR_LENGTH = 80;
export const MAX_INSPECTION_SUMMARY_LENGTH = 1_000;
export const MAX_INSPECTION_FINDINGS = 100_000;

export const SAFE_SYNC_ERROR_MESSAGE = "No se pudo completar la sincronización.";

export function normalizarTextoLimitado(
  value: unknown,
  maxLength: number,
  allowLineBreaks = false,
): string | null {
  if (typeof value !== "string") return null;

  const normalized = value.normalize("NFC").replace(/\r\n?/g, "\n").trim();
  if (normalized.length === 0 || normalized.length > maxLength) return null;

  const controlCharacters = allowLineBreaks
    ? /[\u0000-\u0009\u000B-\u001F\u007F]/
    : /[\u0000-\u001F\u007F]/;

  return controlCharacters.test(normalized) ? null : normalized;
}

export function esFechaIsoCalendarioValida(value: unknown): value is string {
  if (typeof value !== "string") return false;

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year < 1 || month < 1 || month > 12) return false;

  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [
    31,
    leapYear ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ][month - 1];

  return day >= 1 && day <= daysInMonth;
}

export function esEnteroNoNegativoLimitado(value: unknown, maxValue: number): value is number {
  return typeof value === "number"
    && Number.isSafeInteger(value)
    && value >= 0
    && value <= maxValue;
}
