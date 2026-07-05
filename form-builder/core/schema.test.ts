import { describe, expect, it } from "vitest";
import { registerField } from "./registry";
import { validateFormConfig } from "./schema";
import type { FormConfig } from "./types";

const valid: FormConfig = {
  id: "t",
  fields: [
    { type: "text", name: "first" },
    { type: "select", name: "color", options: [{ label: "Red", value: "red" }] },
    { type: "group", name: "team", fields: [{ type: "text", name: "member" }] },
  ],
};

describe("validateFormConfig", () => {
  it("accepts a valid config", () => expect(() => validateFormConfig(valid)).not.toThrow());

  it("rejects missing name", () =>
    expect(() => validateFormConfig({ id: "t", fields: [{ type: "text" } as never] })).toThrow(/name/));

  it("rejects unknown type", () =>
    expect(() => validateFormConfig({ id: "t", fields: [{ type: "wat", name: "x" } as never] })).toThrow(/wat/));

  it("rejects duplicate names at same level", () =>
    expect(() =>
      validateFormConfig({
        id: "t",
        fields: [
          { type: "text", name: "a" },
          { type: "text", name: "a" },
        ],
      }),
    ).toThrow(/duplicate/i));

  it("rejects otp without length", () =>
    expect(() => validateFormConfig({ id: "t", fields: [{ type: "otp", name: "code" } as never] })).toThrow());

  it("recurses into groups", () =>
    expect(() =>
      validateFormConfig({
        id: "t",
        fields: [{ type: "group", name: "g", fields: [{ type: "text" } as never] }],
      }),
    ).toThrow(/name/));

  it("rejects steps referencing unknown fieldNames", () =>
    expect(() =>
      validateFormConfig({ ...valid, steps: [{ title: "s1", fieldNames: ["nope"] }] }),
    ).toThrow(/nope/));

  it("rejects unknown props (typo guard)", () =>
    expect(() =>
      validateFormConfig({
        id: "t",
        fields: [{ type: "file", name: "cv", maxSize: 5 } as never],
      }),
    ).toThrow(/maxSize/));

  it("rejects hidden field without value", () =>
    expect(() =>
      validateFormConfig({ id: "t", fields: [{ type: "hidden", name: "token" } as never] }),
    ).toThrow(/value/));

  it("rejects condition without any operator", () =>
    expect(() =>
      validateFormConfig({
        id: "t",
        fields: [{ type: "text", name: "a", visibleWhen: { field: "b" } }],
      }),
    ).toThrow(/operator/i));

  it("rejects invalid regex pattern", () =>
    expect(() =>
      validateFormConfig({
        id: "t",
        fields: [{ type: "text", name: "a", rules: { pattern: "[unclosed" } }],
      }),
    ).toThrow(/pattern/i));

  it("accepts custom registered field types (BaseField contract only)", () => {
    registerField("rating", () => null);
    expect(() =>
      validateFormConfig({
        id: "t",
        fields: [{ type: "rating", name: "stars", max: 5 }],
      }),
    ).not.toThrow();
  });

  it("custom registered type still requires a name", () => {
    registerField("rating", () => null);
    expect(() =>
      validateFormConfig({ id: "t", fields: [{ type: "rating" } as never] }),
    ).toThrow(/name/);
  });

  it("rejects fields not assigned to any step", () =>
    expect(() =>
      validateFormConfig({
        ...valid,
        steps: [{ title: "s1", fieldNames: ["first", "color"] }],
      }),
    ).toThrow(/team/));

  it("rejects hidden/submit fields listed in steps", () =>
    expect(() =>
      validateFormConfig({
        id: "t",
        fields: [
          { type: "text", name: "a" },
          { type: "submit", name: "go", text: "Go" },
        ],
        steps: [{ title: "s1", fieldNames: ["a", "go"] }],
      }),
    ).toThrow(/go/));
});
