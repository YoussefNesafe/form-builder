import type { Condition, FieldConfig, FormValues } from "./types";

function getPath(values: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>((current, key) => {
    if (current === null || current === undefined) return undefined;
    return (current as Record<string, unknown>)[key];
  }, values);
}

export function evaluateCondition(condition: Condition | undefined, values: Record<string, unknown>): boolean {
  if (!condition) return true;

  const value = getPath(values, condition.field);

  if ("equals" in condition && value !== condition.equals) return false;
  if ("notEquals" in condition && value === condition.notEquals) return false;
  if (condition.in !== undefined && !condition.in.includes(value)) return false;

  return true;
}

export function getVisibleFields(fields: FieldConfig[], values: FormValues): FieldConfig[] {
  return fields.filter((field) => evaluateCondition(field.visibleWhen, values));
}

/**
 * For headless getValues() consumers. The handleSubmit path does not need
 * this: the condition-aware resolver's schema is strip-mode, so the parsed
 * submit payload already excludes condition-hidden values.
 */
export function stripInvisibleValues(fields: FieldConfig[], values: FormValues): FormValues {
  const visibleNames = new Set(getVisibleFields(fields, values).map((field) => field.name));
  return Object.fromEntries(Object.entries(values).filter(([name]) => visibleNames.has(name) || !fields.some((f) => f.name === name)));
}
