import { describe, expect, it } from "vitest";
import {
  validateFormConfig,
  type BaseField,
  type FieldConfig,
  type FieldType,
  type FormConfig,
} from "@/form-builder";
import { BASE_FIELD_PROPS, FIELD_TYPE_ORDER, FIELD_VALUE_INFO } from "./fieldProps";

const EXTRA_SIBLINGS: Partial<Record<FieldType, FieldType>> = {
  otp: "email",
  phone: "country",
};

const STEP_EXEMPT = new Set<FieldType>(["hidden", "submit"]);

function minimalConfigFor(type: FieldType): FormConfig {
  const siblingType = EXTRA_SIBLINGS[type];
  const fields: FieldConfig[] = [
    ...(siblingType ? [FIELD_VALUE_INFO[siblingType].example] : []),
    FIELD_VALUE_INFO[type].example,
  ];

  const fieldNames = fields.filter((field) => !STEP_EXEMPT.has(field.type)).map((field) => field.name);

  return {
    id: `field-types-doc-${type}`,
    fields,
    ...(fieldNames.length > 0 ? { steps: [{ title: "Step", fieldNames }] } : {}),
  };
}

describe("field-types docs BASE_FIELD_PROPS", () => {
  // The per-type table is a mapped type over each variant's own props, so a new
  // type-specific prop breaks the build. BASE_FIELD_PROPS is a plain array, so a
  // new BaseField prop would just quietly go undocumented — this is its guard.
  it("documents every base prop", () => {
    const documented = new Set<string>(BASE_FIELD_PROPS.map((prop) => prop.name));
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
    for (const key of Object.keys(BASE_FIELD_KEYS)) {
      expect(documented.has(key), `BASE_FIELD_PROPS is missing "${key}"`).toBe(true);
    }
  });
});

describe("field-types docs FIELD_VALUE_INFO examples", () => {
  it.each(FIELD_TYPE_ORDER)("%s example passes validateFormConfig", (type) => {
    const config = minimalConfigFor(type);
    expect(() => validateFormConfig(config)).not.toThrow();
  });

  it.each(FIELD_TYPE_ORDER)("%s example's own type matches its FIELD_VALUE_INFO key", (type) => {
    expect(FIELD_VALUE_INFO[type].example.type).toBe(type);
  });
});
