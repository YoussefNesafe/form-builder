import type { Condition } from "./types";

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
  if ("in" in condition && !(condition.in ?? []).includes(value)) return false;

  return true;
}
