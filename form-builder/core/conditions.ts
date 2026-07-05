import type { AnyFieldConfig, Condition, FormValues } from "./types";

function getPath(values: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>((current, key) => {
    if (current === null || current === undefined) return undefined;
    return (current as Record<string, unknown>)[key];
  }, values);
}

/** For callers that already resolved the source field's value (e.g. useWatch). */
export function conditionMatches(condition: Condition, value: unknown): boolean {
  if (condition.equals !== undefined && value !== condition.equals) return false;
  if (condition.notEquals !== undefined && value === condition.notEquals) return false;
  if (condition.in !== undefined && !condition.in.includes(value)) return false;
  return true;
}

export function evaluateCondition(condition: Condition | undefined, values: Record<string, unknown>): boolean {
  if (!condition) return true;
  return conditionMatches(condition, getPath(values, condition.field));
}

export function getVisibleFields(fields: AnyFieldConfig[], values: FormValues): AnyFieldConfig[] {
  return fields.filter((field) => evaluateCondition(field.visibleWhen, values));
}

/**
 * For headless getValues() consumers. The handleSubmit path does not need
 * this: the condition-aware resolver's schema is strip-mode, so the parsed
 * submit payload already excludes condition-hidden values.
 */
export function stripInvisibleValues(fields: AnyFieldConfig[], values: FormValues): FormValues {
  const visibleNames = new Set(getVisibleFields(fields, values).map((field) => field.name));
  return Object.fromEntries(Object.entries(values).filter(([name]) => visibleNames.has(name) || !fields.some((f) => f.name === name)));
}
