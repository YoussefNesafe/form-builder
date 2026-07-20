import { describe, expect, it } from "vitest";
import {
  conditionFieldNames,
  conditionSpecMatches,
  evaluateCondition,
  getVisibleFields,
  hiddenStepFieldNames,
  stripInvisibleValues,
  toConditionGroups,
  visibleFieldsFor,
} from "./conditions";
import type { FieldConfig, FormConfig } from "./types";

describe("evaluateCondition", () => {
  it("equals matches and mismatches", () => {
    expect(evaluateCondition({ field: "a", equals: 2 }, { a: 2 })).toBe(true);
    expect(evaluateCondition({ field: "a", equals: 2 }, { a: 3 })).toBe(false);
  });

  it("notEquals", () => {
    expect(evaluateCondition({ field: "a", notEquals: "x" }, { a: "y" })).toBe(true);
    expect(evaluateCondition({ field: "a", notEquals: "x" }, { a: "x" })).toBe(false);
  });

  it("in includes and excludes", () => {
    expect(evaluateCondition({ field: "a", in: [1, 2] }, { a: 2 })).toBe(true);
    expect(evaluateCondition({ field: "a", in: [1, 2] }, { a: 3 })).toBe(false);
  });

  it("missing field compares against undefined", () => {
    expect(evaluateCondition({ field: "gone", equals: undefined }, {})).toBe(true);
    expect(evaluateCondition({ field: "gone", equals: "x" }, {})).toBe(false);
    expect(evaluateCondition({ field: "gone", notEquals: "x" }, {})).toBe(true);
  });

  it("multiple operators AND together", () => {
    expect(evaluateCondition({ field: "a", notEquals: "x", in: ["y", "z"] }, { a: "y" })).toBe(true);
    expect(evaluateCondition({ field: "a", notEquals: "y", in: ["y", "z"] }, { a: "y" })).toBe(false);
  });

  it("no operators is true", () => {
    expect(evaluateCondition({ field: "a" }, { a: "anything" })).toBe(true);
  });

  it("undefined condition is true", () => {
    expect(evaluateCondition(undefined, { a: 1 })).toBe(true);
  });

  it("dot-path names resolve nested values", () => {
    expect(evaluateCondition({ field: "team.0.role", equals: "lead" }, { team: [{ role: "lead" }] })).toBe(true);
    expect(evaluateCondition({ field: "team.1.role", equals: "lead" }, { team: [{ role: "lead" }] })).toBe(false);
  });

  it("array spec ANDs across fields", () => {
    const spec = [
      { field: "a", equals: 1 },
      { field: "b", equals: 2 },
    ];
    expect(evaluateCondition(spec, { a: 1, b: 2 })).toBe(true);
    expect(evaluateCondition(spec, { a: 1, b: 3 })).toBe(false);
  });

  it("anyOf spec ORs groups of ANDs", () => {
    const spec = {
      anyOf: [
        [{ field: "a", equals: 1 }, { field: "b", equals: 2 }],
        [{ field: "c", equals: 3 }],
      ],
    };
    expect(evaluateCondition(spec, { a: 1, b: 2, c: 0 })).toBe(true);
    expect(evaluateCondition(spec, { a: 1, b: 0, c: 3 })).toBe(true);
    expect(evaluateCondition(spec, { a: 1, b: 0, c: 0 })).toBe(false);
  });

  it("empty specs match, same as absent", () => {
    expect(evaluateCondition([], { a: 1 })).toBe(true);
    expect(evaluateCondition({ anyOf: [] }, { a: 1 })).toBe(true);
    expect(evaluateCondition({ anyOf: [[]] }, { a: 1 })).toBe(true);
  });

  it("isValid consults the oracle with the source value", () => {
    const calls: [string, unknown][] = [];
    const oracle = (name: string, value: unknown) => {
      calls.push([name, value]);
      return name === "first";
    };
    expect(evaluateCondition({ field: "first", isValid: true }, { first: "x" }, oracle)).toBe(true);
    expect(evaluateCondition({ field: "other", isValid: true }, { other: "y" }, oracle)).toBe(false);
    expect(evaluateCondition({ field: "other", isValid: false }, { other: "y" }, oracle)).toBe(true);
    expect(calls).toContainEqual(["first", "x"]);
    expect(calls).toContainEqual(["other", "y"]);
  });

  it("isValid without an oracle is skipped, other operators still apply", () => {
    expect(evaluateCondition({ field: "a", isValid: true }, { a: 1 })).toBe(true);
    expect(evaluateCondition({ field: "a", isValid: true, equals: 2 }, { a: 1 })).toBe(false);
  });

  it("mixed value + isValid operators AND within a leaf", () => {
    const oracle = () => true;
    expect(evaluateCondition({ field: "a", equals: 1, isValid: true }, { a: 1 }, oracle)).toBe(true);
    expect(evaluateCondition({ field: "a", equals: 2, isValid: true }, { a: 1 }, oracle)).toBe(false);
  });
});

describe("spec helpers", () => {
  it("toConditionGroups normalizes every shape", () => {
    expect(toConditionGroups(undefined)).toEqual([]);
    expect(toConditionGroups({ field: "a", equals: 1 })).toEqual([[{ field: "a", equals: 1 }]]);
    expect(toConditionGroups([{ field: "a", equals: 1 }])).toEqual([[{ field: "a", equals: 1 }]]);
    expect(toConditionGroups({ anyOf: [[{ field: "a", equals: 1 }]] })).toEqual([[{ field: "a", equals: 1 }]]);
  });

  it("conditionFieldNames dedupes across groups", () => {
    const spec = {
      anyOf: [
        [{ field: "a", equals: 1 }, { field: "b", equals: 2 }],
        [{ field: "a", equals: 3 }],
      ],
    };
    expect(conditionFieldNames(spec)).toEqual(["a", "b"]);
    expect(conditionFieldNames(undefined)).toEqual([]);
  });

  it("conditionSpecMatches reads values through the lookup", () => {
    const values: Record<string, unknown> = { "team.0.role": "lead" };
    expect(conditionSpecMatches({ field: "team.0.role", equals: "lead" }, (name) => values[name])).toBe(true);
  });
});

describe("visibility helpers", () => {
  const fields: FieldConfig[] = [
    { type: "checkbox", name: "other" },
    { type: "text", name: "details", visibleWhen: { field: "other", equals: true } },
    { type: "hidden", name: "utm", value: "x" },
  ];

  it("getVisibleFields filters by condition", () => {
    expect(getVisibleFields(fields, { other: false }).map((f) => f.name)).toEqual(["other", "utm"]);
    expect(getVisibleFields(fields, { other: true }).map((f) => f.name)).toEqual(["other", "details", "utm"]);
  });

  it("stripInvisibleValues drops hidden-by-condition values, keeps unknown keys", () => {
    const values = { other: false, details: "stale", utm: "x", extra: 1 };
    expect(stripInvisibleValues(fields, values)).toEqual({ other: false, utm: "x", extra: 1 });
  });
});

describe("conditional steps", () => {
  const config: FormConfig = {
    id: "t",
    fields: [
      { type: "checkbox", name: "wantsExtras" },
      { type: "text", name: "basic" },
      { type: "text", name: "extra1" },
      { type: "text", name: "extra2", visibleWhen: { field: "basic", equals: "show" } },
    ],
    steps: [
      { title: "Base", fieldNames: ["wantsExtras", "basic"] },
      { title: "Extras", fieldNames: ["extra1", "extra2"], visibleWhen: { field: "wantsExtras", equals: true } },
    ],
  };

  it("hiddenStepFieldNames collects fields of non-matching steps", () => {
    expect(hiddenStepFieldNames(config, { wantsExtras: false })).toEqual(new Set(["extra1", "extra2"]));
    expect(hiddenStepFieldNames(config, { wantsExtras: true })).toEqual(new Set());
  });

  it("visibleFieldsFor combines field-level and step-level visibility", () => {
    const names = (values: Record<string, unknown>) => visibleFieldsFor(config, values).map((f) => f.name);
    expect(names({ wantsExtras: false, basic: "show" })).toEqual(["wantsExtras", "basic"]);
    expect(names({ wantsExtras: true, basic: "show" })).toEqual(["wantsExtras", "basic", "extra1", "extra2"]);
    expect(names({ wantsExtras: true, basic: "" })).toEqual(["wantsExtras", "basic", "extra1"]);
  });

  it("configs without steps are unaffected", () => {
    const flat: FormConfig = { id: "f", fields: [{ type: "text", name: "a" }] };
    expect(visibleFieldsFor(flat, {}).map((f) => f.name)).toEqual(["a"]);
  });
});
