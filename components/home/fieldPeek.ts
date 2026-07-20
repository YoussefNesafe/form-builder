import type { AnyFieldConfig, FormConfig } from "@/form-builder";

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
    .replace(/"([a-zA-Z_$][\w$]*)":/g, "$1: ")
    .replace(/,(?=\S)/g, ", ");
  return `{ ${compact.slice(1, -1)} }`;
}
