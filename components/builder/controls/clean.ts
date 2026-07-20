export function pruneEmpty<T extends Record<string, unknown>>(
  obj: T,
  exempt?: (key: string) => boolean,
): Partial<T> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined || value === null) continue;
    if ((value === "" || value === false) && !exempt?.(key)) continue;
    out[key] = value;
  }
  return out as Partial<T>;
}

export function pruneEmptyOrUndefined<T extends Record<string, unknown>>(obj: T): T | undefined {
  const out = pruneEmpty(obj);
  return Object.keys(out).length ? (out as T) : undefined;
}
