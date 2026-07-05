import { describe, expect, it } from "vitest";
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
});
