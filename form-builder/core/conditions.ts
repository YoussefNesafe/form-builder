import type { AnyFieldConfig, Condition, ConditionSpec, FormConfig, FormValues } from "./types";

/** Validity oracle: source field's zod schema passing for the given value. */
export type IsFieldValid = (fieldName: string, value: unknown) => boolean;

function getPath(values: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>((current, key) => {
    if (current === null || current === undefined) return undefined;
    return (current as Record<string, unknown>)[key];
  }, values);
}

/**
 * Normalize every spec shape to OR-of-AND-groups. An empty spec ([] or
 * { anyOf: [] }) means "no conditions" and matches, same as absent.
 */
export function toConditionGroups(spec: ConditionSpec | undefined): Condition[][] {
  if (!spec) return [];
  if (Array.isArray(spec)) return [spec];
  if ("anyOf" in spec) return spec.anyOf;
  return [[spec]];
}

/**
 * Inverse of toConditionGroups — the minimal spec shape for serialization
 * (single condition stays a bare object, one group stays an array).
 */
export function fromConditionGroups(groups: Condition[][]): ConditionSpec | undefined {
  if (groups.length === 0) return undefined;
  if (groups.length === 1) return groups[0].length === 1 ? groups[0][0] : groups[0];
  return { anyOf: groups };
}

/** Distinct source field names across a spec — what the runtime must watch. */
export function conditionFieldNames(spec: ConditionSpec | undefined): string[] {
  return [...new Set(toConditionGroups(spec).flat().map((condition) => condition.field))];
}

/**
 * For callers that already resolved the source field's value (e.g. useWatch).
 * Without an isValid oracle the isValid operator is skipped (treated as
 * matching) — the config validator confines isValid to disabledWhen/
 * enabledWhen, whose runtime callers always supply the oracle.
 */
export function conditionMatches(condition: Condition, value: unknown, isValid?: IsFieldValid): boolean {
  if (condition.equals !== undefined && value !== condition.equals) return false;
  if (condition.notEquals !== undefined && value === condition.notEquals) return false;
  if (condition.in !== undefined && !condition.in.includes(value)) return false;
  if (condition.isValid !== undefined && isValid && isValid(condition.field, value) !== condition.isValid) return false;
  return true;
}

/** DNF evaluation over a value lookup: any group where every condition matches. */
export function conditionSpecMatches(
  spec: ConditionSpec | undefined,
  getValue: (fieldName: string) => unknown,
  isValid?: IsFieldValid,
): boolean {
  const groups = toConditionGroups(spec);
  if (groups.length === 0) return true;
  return groups.some((group) => group.every((condition) => conditionMatches(condition, getValue(condition.field), isValid)));
}

export function evaluateCondition(
  spec: ConditionSpec | undefined,
  values: Record<string, unknown>,
  isValid?: IsFieldValid,
): boolean {
  return conditionSpecMatches(spec, (fieldName) => getPath(values, fieldName), isValid);
}

export function getVisibleFields(fields: AnyFieldConfig[], values: FormValues): AnyFieldConfig[] {
  return fields.filter((field) => evaluateCondition(field.visibleWhen, values));
}

/** Field names owned by steps whose visibleWhen does not match. */
export function hiddenStepFieldNames(config: FormConfig, values: FormValues): Set<string> {
  const hidden = new Set<string>();
  for (const step of config.steps ?? []) {
    if (!evaluateCondition(step.visibleWhen, values)) {
      for (const name of step.fieldNames) hidden.add(name);
    }
  }
  return hidden;
}

/**
 * Effective visibility: a field's own visibleWhen AND its owning step's.
 * The single source the resolver validates against — hidden-step fields are
 * excluded from the schema and stripped from the payload exactly like
 * condition-hidden fields.
 */
export function visibleFieldsFor(config: FormConfig, values: FormValues): AnyFieldConfig[] {
  const stepHidden = hiddenStepFieldNames(config, values);
  return getVisibleFields(config.fields, values).filter((field) => !stepHidden.has(field.name));
}

/**
 * For headless getValues() consumers. The handleSubmit path does not need
 * this: the condition-aware resolver's schema is strip-mode, so the parsed
 * submit payload already excludes condition-hidden values.
 *
 * Fields-only — it cannot see step visibility. With conditional steps,
 * derive the visible set via visibleFieldsFor(config, values) instead.
 */
export function stripInvisibleValues(fields: AnyFieldConfig[], values: FormValues): FormValues {
  const visibleNames = new Set(getVisibleFields(fields, values).map((field) => field.name));
  return Object.fromEntries(Object.entries(values).filter(([name]) => visibleNames.has(name) || !fields.some((f) => f.name === name)));
}
