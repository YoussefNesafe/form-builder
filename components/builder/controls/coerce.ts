export function coerceScalar(raw: string): string | number | boolean {
  const t = raw.trim();
  if (t === "true") return true;
  if (t === "false") return false;
  if (t !== "" && String(Number(t)) === t) return Number(t);
  return raw;
}

export function scalarToText(value: unknown): string {
  if (value === undefined || value === null) return "";
  return String(value);
}
