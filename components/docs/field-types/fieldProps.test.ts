import { describe, expect, it } from "vitest";
import { validateFormConfig, type FieldConfig, type FieldType, type FormConfig } from "@/form-builder";
import { FIELD_TYPE_ORDER, FIELD_VALUE_INFO } from "./fieldProps";

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

describe("field-types docs FIELD_VALUE_INFO examples", () => {
  it.each(FIELD_TYPE_ORDER)("%s example passes validateFormConfig", (type) => {
    const config = minimalConfigFor(type);
    expect(() => validateFormConfig(config)).not.toThrow();
  });

  it.each(FIELD_TYPE_ORDER)("%s example's own type matches its FIELD_VALUE_INFO key", (type) => {
    expect(FIELD_VALUE_INFO[type].example.type).toBe(type);
  });
});
