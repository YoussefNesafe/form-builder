import { describe, expect, it } from "vitest";
import { validateFormConfig, type FieldConfig, type FieldType, type FormConfig } from "@/form-builder";
import { FIELD_TYPE_ORDER, FIELD_VALUE_INFO } from "./fieldProps";

/**
 * Pins that every per-type example in FIELD_VALUE_INFO is not just
 * TYPE-correct (the mapped type in fieldProps.ts already guarantees that at
 * compile time) but also RUNTIME-valid per validateFormConfig — the docs
 * page renders these as copy-paste snippets, so a config that compiles but
 * fails validation would be a silent lie on the page.
 *
 * validateFormConfig checks a whole FormConfig, not a lone field, so each
 * example is wrapped in the smallest legal config around it:
 *   - a sibling field is added only when the example references one by name
 *     (otp.dependsOn: "email", phone.countryFrom: "country") — resolved by
 *     reusing that OTHER type's own example, whose name already matches
 *     (email example is named "email", country example is named "country").
 *   - a single step lists every non-step-exempt field, since
 *     validateFormConfig requires that whenever `steps` is present at all
 *     (hidden/submit are exempt — see schema.ts `exemptFromSteps`; static is
 *     NOT exempt, confirmed by wizards/demoConfig.test.ts).
 * Nothing on the example itself is ever mutated.
 */

// dependsOn/countryFrom targets, resolved via sibling examples of that name.
const EXTRA_SIBLINGS: Partial<Record<FieldType, FieldType>> = {
  otp: "email", // otp example: dependsOn: "email"
  phone: "country", // phone example: countryFrom: "country"
};

// The only types validateFormConfig exempts from step assignment.
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

  // fieldProps.ts pins each example to VariantFor<T>, which is exact for 22
  // of the 24 types — but the two grouped variants ("text"|"email"|"textarea"
  // and "checkbox"|"switch") share a single variant object, so e.g.
  // VariantFor<"text"> still type-checks an example whose `type` is "email".
  // This runtime check is what actually catches a misfiled example within a
  // group (the compiler already catches everything else — see fieldProps.ts).
  it.each(FIELD_TYPE_ORDER)("%s example's own type matches its FIELD_VALUE_INFO key", (type) => {
    expect(FIELD_VALUE_INFO[type].example.type).toBe(type);
  });
});
