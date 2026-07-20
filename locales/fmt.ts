export function fmt(s: string, params: Record<string, string | number>): string {
  return s.replace(/\{(\w+)\}/g, (_, k) => String(params[k] ?? `{${k}}`));
}
