/**
 * Coerce a text field into the primitive a condition compares against, so
 * common cases (`equals true`, `equals 3`) work without a type picker:
 * "true"/"false" → boolean, numeric string → number, otherwise the string.
 */
export function coerceScalar(raw: string): string | number | boolean {
  const t = raw.trim();
  if (t === "true") return true;
  if (t === "false") return false;
  // Only treat as a number when it round-trips exactly — preserves leading-zero
  // codes ("007"), exponents ("1e3"), and hex-looking strings as plain strings.
  if (t !== "" && String(Number(t)) === t) return Number(t);
  return raw;
}

/** Round-trip a coerced scalar back to its text form for an input. */
export function scalarToText(value: unknown): string {
  if (value === undefined || value === null) return "";
  return String(value);
}
