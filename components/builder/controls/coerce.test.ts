import { describe, it, expect } from "vitest";
import { coerceScalar, scalarToText } from "./coerce";

describe("coerceScalar", () => {
  it("coerces booleans and numbers, leaves other strings", () => {
    expect(coerceScalar("true")).toBe(true);
    expect(coerceScalar("false")).toBe(false);
    expect(coerceScalar("42")).toBe(42);
    expect(coerceScalar("3.5")).toBe(3.5);
    expect(coerceScalar("red")).toBe("red");
    expect(coerceScalar("")).toBe("");
  });
});

describe("scalarToText", () => {
  it("stringifies primitives, empties nullish", () => {
    expect(scalarToText(true)).toBe("true");
    expect(scalarToText(7)).toBe("7");
    expect(scalarToText("x")).toBe("x");
    expect(scalarToText(undefined)).toBe("");
    expect(scalarToText(null)).toBe("");
  });
});
