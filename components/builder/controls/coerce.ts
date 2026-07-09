/**
 * Coerce a text field into the primitive a condition compares against, so
 * common cases (`equals true`, `equals 3`) work without a type picker:
 * "true"/"false" → boolean, numeric string → number, otherwise the string.
 */
export function coerceScalar(raw: string): string | number | boolean {
  const t = raw.trim();
  if (t === "true") return true;
  if (t === "false") return false;
  if (t !== "" && !Number.isNaN(Number(t))) return Number(t);
  return raw;
}

/** Round-trip a coerced scalar back to its text form for an input. */
export function scalarToText(value: unknown): string {
  if (value === undefined || value === null) return "";
  return String(value);
}
