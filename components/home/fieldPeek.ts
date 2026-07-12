import type { AnyFieldConfig, FormConfig } from "@/form-builder";

/**
 * Renders a handful of named fields from a real FormConfig as compact,
 * single-line pseudo-TS, e.g. `{ type: "phone", name: "phone", countryFrom: "country" }`.
 * The text comes straight from the actual config object (JSON.stringify +
 * light key-unquoting) — never a hand-typed peek string, so a config edit
 * can't silently leave a showcase card's preview stale. Missing names are
 * silently skipped rather than throwing — a typo in `peekFieldNames` should
 * fail loud in review (fewer peek lines than expected), not crash the page.
 *
 * Known limitation: toPeekLine regexes the whole JSON string, so a string
 * VALUE containing `,` or an `ident:`-shaped substring would get mutated too
 * (e.g. label "a,b" renders as "a, b"). Fine for decorative peeks over the
 * current configs; don't reuse this helper anywhere exactness matters.
 */
export function peekFields(config: FormConfig, names: readonly string[]): string {
  const byName = new Map(config.fields.map((field) => [field.name, field]));
  return names
    .map((name) => byName.get(name))
    .filter((field): field is AnyFieldConfig => Boolean(field))
    .map(toPeekLine)
    .join("\n");
}

function toPeekLine(field: AnyFieldConfig): string {
  const compact = JSON.stringify(field)
    .replace(/"([a-zA-Z_$][\w$]*)":/g, "$1: ") // unquote object keys
    .replace(/,(?=\S)/g, ", "); // space after commas for readability
  return `{ ${compact.slice(1, -1)} }`;
}
