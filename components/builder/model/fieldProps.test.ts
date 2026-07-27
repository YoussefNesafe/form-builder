import { describe, it, expect } from "vitest";
import { BUILT_IN_FIELD_TYPES, validateFormConfig, type BaseField, type FieldType } from "@/form-builder";
import { FIELD_PROPS } from "./fieldProps";
import { FIELD_META } from "./fieldMeta";
import { DEFAULT_PROPS } from "./defaults";
import { serialize } from "./serialize";
import type { BuilderNode, BuilderState } from "./types";

// Compiler-enforced, unlike REQUIRED_TYPE_KEYS below: a new prop on BaseField
// leaves this object incomplete and fails typecheck, so a base prop can't slip
// into the engine without the builder growing an editor for it.
const BASE_FIELD_KEYS: Record<keyof BaseField, true> = {
  name: true,
  label: true,
  description: true,
  badge: true,
  placeholder: true,
  required: true,
  disabled: true,
  visibleWhen: true,
  disabledWhen: true,
  enabledWhen: true,
  enabledWhenVerified: true,
  copyFrom: true,
  width: true,
};

const REQUIRED_TYPE_KEYS: Record<string, string[]> = {
  text: ["rules"],
  email: ["rules"],
  textarea: ["rules"],
  password: ["rules", "complexity"],
  masked: ["mask", "message"],
  number: ["min", "max", "step"],
  otp: ["length", "dependsOn"],
  phone: ["defaultCountry", "preferredCountries", "countryFrom"],
  select: ["options", "optionsFrom", "searchable", "multiple"],
  country: ["countries", "preferredCountries"],
  radio: ["options"],
  segmented: ["options"],
  checkbox: ["options"],
  switch: ["options"],
  date: ["range", "minDate", "maxDate", "minDateField", "maxDateField", "message", "pickerBounds"],
  time: ["minTime", "maxTime", "stepMinutes", "minTimeField", "maxTimeField"],
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

  it("exposes an editor for every base prop, not just the type-specific ones", () => {
    // text carries the full base set (BASE + COPY_FROM), so it is the type that
    // proves a new BaseField prop reached the builder at all.
    const keys = new Set(FIELD_PROPS.text.map((d) => d.key));
    for (const key of Object.keys(BASE_FIELD_KEYS)) {
      expect(keys.has(key), `text is missing an editor for base prop "${key}"`).toBe(true);
    }
  });

  it("exposes no keys outside the base set plus type-specific keys", () => {
    // content (static) and value (hidden) stand in for the label those types
    // don't have; they're type-specific keys that live outside REQUIRED_TYPE_KEYS.
    const BASE_KEYS = [...Object.keys(BASE_FIELD_KEYS), "content", "value"];
    for (const type of BUILT_IN_FIELD_TYPES) {
      const allowed = new Set([...BASE_KEYS, ...(REQUIRED_TYPE_KEYS[type] ?? [])]);
      for (const d of FIELD_PROPS[type]) {
        expect(allowed.has(d.key), `${type} has unexpected key "${d.key}"`).toBe(true);
      }
    }
  });

  it("uses control kinds that match each prop's shape", () => {
    const EXPECT_CONTROL: Record<string, string> = {
      required: "boolean",
      disabled: "boolean",
      searchable: "boolean",
      multiple: "boolean",
      range: "boolean",
      // Deliberately not "boolean" — see the pickerBounds serialization test.
      pickerBounds: "select",
      min: "number",
      max: "number",
      step: "number",
      length: "number",
      stepMinutes: "number",
      heightPx: "number",
      maxSizeMB: "number",
      options: "options",
      optionsFrom: "optionsFrom",
      value: "json",
      visibleWhen: "condition",
      disabledWhen: "condition",
      enabledWhen: "condition",
      width: "width",
    };
    for (const type of BUILT_IN_FIELD_TYPES) {
      for (const d of FIELD_PROPS[type]) {
        const expected = EXPECT_CONTROL[d.key];
        if (expected) expect(d.control, `${type}.${d.key} control`).toBe(expected);
      }
    }
  });

  it("always exposes name; input types expose label", () => {
    for (const type of BUILT_IN_FIELD_TYPES) {
      const keys = FIELD_PROPS[type].map((d) => d.key);
      expect(keys, `${type} must edit name`).toContain("name");
    }
  });

  it("a non-default pickerBounds survives serialization", () => {
    // The editor for it has to be a "select", not a "boolean": pruneEmpty drops
    // false and BooleanControl emits undefined for "off", so a boolean prop can
    // only ever mean "present or absent" — which cannot express turning OFF a
    // default-on behaviour. A silent no-op toggle is what this pins against.
    const state: Pick<BuilderState, "title" | "description" | "nodes" | "multiStep" | "steps"> = {
      title: "T",
      description: "",
      nodes: [{ _id: "x", type: "date" as FieldType, props: { name: "dob", pickerBounds: "validate" } }],
      multiStep: false,
      steps: [],
    };
    const config = serialize({ ...state } as BuilderState);
    expect(config.fields[0]).toMatchObject({ type: "date", name: "dob", pickerBounds: "validate" });
    expect(() => validateFormConfig(config)).not.toThrow();
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
