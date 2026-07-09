import { describe, expect, it } from "vitest";
import { defaultMessages, mergeMessages } from "./messages";
import { getPasswordChecks } from "./password";
import { registerField } from "./registry";
import { buildDefaultValues } from "../hooks/useDynamicForm";

describe("mergeMessages", () => {
  it("overrides only the provided keys", () => {
    const merged = mergeMessages({ required: "Champ requis" });
    expect(merged.required).toBe("Champ requis");
    expect(merged.email).toBe(defaultMessages.email);
  });
});

describe("getPasswordChecks", () => {
  it("builds only the requested checks, in catalog wording", () => {
    const checks = getPasswordChecks({ uppercase: true, minLength: 8 }, defaultMessages);
    expect(checks.map((check) => check.key)).toEqual(["uppercase", "minLength"]);
    expect(checks[1].label).toBe(defaultMessages.passwordMinLength(8));
    expect(checks[0].test("abc")).toBe(false);
    expect(checks[0].test("Abc")).toBe(true);
    expect(checks[1].test("12345678")).toBe(true);
  });
});

describe("buildDefaultValues", () => {
  it("custom fields default to their defaultValue prop", () => {
    registerField("probe-field", () => null);
    const defaults = buildDefaultValues([
      { type: "probe-field", name: "stars", defaultValue: 3 },
      { type: "text", name: "note" },
    ]);
    expect(defaults.stars).toBe(3);
    expect(defaults.note).toBe("");
  });

  it("time defaults to empty string, rating to undefined", () => {
    const defaults = buildDefaultValues([
      { type: "time", name: "meeting" },
      { type: "rating", name: "stars" },
    ]);
    expect(defaults.meeting).toBe("");
    expect("stars" in defaults).toBe(true);
    expect(defaults.stars).toBeUndefined();
  });
});
