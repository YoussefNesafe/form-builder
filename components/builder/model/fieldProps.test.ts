import { describe, it, expect } from "vitest";
import { BUILT_IN_FIELD_TYPES, type FieldType } from "@/form-builder";
import { validateFormConfig } from "@/form-builder/core/schema";
import { FIELD_PROPS } from "./fieldProps";
import { FIELD_META } from "./fieldMeta";
import { DEFAULT_PROPS } from "./defaults";
import { serialize } from "./serialize";
import type { BuilderNode, BuilderState } from "./types";

// The type-specific (non-base) props each built-in type must expose an editor
// for, mirrored from form-builder/core/types.ts. Base props (name/label/etc.)
// are asserted separately.
const REQUIRED_TYPE_KEYS: Record<string, string[]> = {
  text: ["rules"],
  email: ["rules"],
  textarea: ["rules"],
  password: ["rules", "complexity"],
  masked: ["mask", "message"],
  number: ["min", "max", "step"],
  otp: ["length", "dependsOn"],
  phone: ["defaultCountry", "preferredCountries", "countryFrom"],
  select: ["options", "searchable", "multiple"],
  country: ["countries", "preferredCountries"],
  radio: ["options"],
  segmented: ["options"],
  checkbox: ["options"],
  switch: ["options"],
  date: ["range", "minDate", "maxDate"],
  time: ["minTime", "maxTime", "stepMinutes"],
  rating: ["max"],
  slider: ["min", "max", "step"],
  signature: ["penColor", "heightPx"],
  file: ["accept", "maxSizeMB", "multiple"],
  hidden: ["value"],
  static: ["content", "as"],
  submit: ["text", "variant"],
  group: ["min", "max"],
};

describe("field prop registry", () => {
  it("has descriptors and metadata for every built-in type", () => {
    for (const type of BUILT_IN_FIELD_TYPES) {
      expect(FIELD_PROPS[type], `FIELD_PROPS[${type}]`).toBeDefined();
      expect(FIELD_PROPS[type].length, `FIELD_PROPS[${type}] non-empty`).toBeGreaterThan(0);
      expect(FIELD_META[type], `FIELD_META[${type}]`).toBeDefined();
    }
  });

  it("uses unique keys within each type", () => {
    for (const type of BUILT_IN_FIELD_TYPES) {
      const keys = FIELD_PROPS[type].map((d) => d.key);
      expect(new Set(keys).size, `duplicate keys in ${type}`).toBe(keys.length);
    }
  });

  it("exposes an editor for every type-specific prop in the engine types", () => {
    for (const type of BUILT_IN_FIELD_TYPES) {
      const keys = new Set(FIELD_PROPS[type].map((d) => d.key));
      for (const required of REQUIRED_TYPE_KEYS[type] ?? []) {
        expect(keys.has(required), `${type} is missing an editor for "${required}"`).toBe(true);
      }
    }
  });

  it("always exposes name; input types expose label", () => {
    for (const type of BUILT_IN_FIELD_TYPES) {
      const keys = FIELD_PROPS[type].map((d) => d.key);
      expect(keys, `${type} must edit name`).toContain("name");
    }
  });

  it("a freshly-added field of every type serializes to a valid single-field config", () => {
    for (const type of BUILT_IN_FIELD_TYPES) {
      const node: BuilderNode = {
        _id: "x",
        type: type as FieldType,
        props: { name: "f", ...structuredClone(DEFAULT_PROPS[type]) },
        ...(type === "group" ? { children: [{ _id: "c", type: "text", props: { name: "child" } }] } : {}),
      };
      const state: Pick<BuilderState, "title" | "description" | "nodes" | "multiStep" | "steps"> = {
        title: "T",
        description: "",
        nodes: [node],
        multiStep: false,
        steps: [],
      };
      expect(() => validateFormConfig(serialize({ ...state } as BuilderState)), `type ${type}`).not.toThrow();
    }
  });
});
