/**
 * Drop keys that are equivalent to "absent" in the engine/builder: `undefined`,
 * `null`, empty string, and `false`. Keys matching `exempt` skip the ""/false
 * pruning (still drop undefined/null) — e.g. a hidden field's `value` must
 * keep its key even when the value is `""` or `false`.
 */
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

/**
 * `pruneEmpty`, but collapses an all-empty result to `undefined` — the
 * convention builder control editors (RulesEditor, ComplexityEditor) use for
 * "no rules/complexity configured" so the prop is omitted entirely rather
 * than serialized as `{}`.
 *
 * Deliberately the strictest of the three `clean()`s this replaced — no
 * `exempt` escape hatch, so it drops `undefined | null | "" | false` with no
 * exceptions. A future prop that legitimately wants to keep `""` or `null`
 * (like serialize.ts's hidden-field `value`) must use `pruneEmpty` directly
 * with an `exempt` predicate instead of this wrapper.
 */
export function pruneEmptyOrUndefined<T extends Record<string, unknown>>(obj: T): T | undefined {
  const out = pruneEmpty(obj);
  return Object.keys(out).length ? (out as T) : undefined;
}
