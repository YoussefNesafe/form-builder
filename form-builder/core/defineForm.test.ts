import { describe, it, expect, expectTypeOf } from "vitest";
import { defineForm } from "./defineForm";
import type { FormConfig } from "./types";

describe("defineForm", () => {
  it("returns the config argument unchanged at runtime", () => {
    const cfg = { id: "f", fields: [{ name: "email", type: "email" }] };
    expect(defineForm(cfg)).toBe(cfg);
  });

  it("preserves the literal type (const type param)", () => {
    const cfg = defineForm({ id: "f", fields: [{ name: "email", type: "email" }] });
    expectTypeOf(cfg.fields[0].name).toEqualTypeOf<"email">();
    expectTypeOf(cfg).toMatchTypeOf<FormConfig>();
  });
});
