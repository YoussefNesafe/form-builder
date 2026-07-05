import { describe, expect, it } from "vitest";
import { evaluateCondition } from "./conditions";

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
});
