/**
 * Interpolate `{name}` placeholders. Split out from `locales/index.ts` (which
 * also pulls in the full `en` dictionary aggregate) so client components that
 * only need interpolation — not the full dictionary — can import this alone
 * and keep the aggregate out of their bundle (see the bundle-hygiene note in
 * `locales/en/builder.ts` and its consumers).
 */
export function fmt(s: string, params: Record<string, string | number>): string {
  return s.replace(/\{(\w+)\}/g, (_, k) => String(params[k] ?? `{${k}}`));
}
