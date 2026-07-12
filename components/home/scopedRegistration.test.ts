import { describe, expect, it } from "vitest";
import { multiStepSignupConfig } from "@/app/(site)/examples/multi-step-signup/config";
import { type AnyFieldConfig, type FormConfig, isBuiltInField } from "@/form-builder/core/types";
import { landingDemoConfig } from "./demoConfig";
import { FLAGSHIP_REGISTERED_TYPES } from "./FlagshipSignupForm";
import { LANDING_DEMO_REGISTERED_TYPES } from "./LandingDemoForm";

// The two landing-page live-form leaves deliberately register a scoped subset
// of field renderers instead of registerBuiltInFields() (which would pull all
// 24 renderers — phone/signature libs included — into the landing bundle; see
// the comments in LandingDemoForm.tsx / FlagshipSignupForm.tsx). Nothing
// enforced that scope at build time: a field type added to a config without a
// matching registerField only fails at runtime inside StaticExampleBoundary.
// These tests close that gap.

function collectFieldTypes(fields: AnyFieldConfig[]): string[] {
  return fields.flatMap((field) =>
    isBuiltInField(field) && field.type === "group"
      ? [field.type, ...collectFieldTypes(field.fields)]
      : [field.type],
  );
}

function configFieldTypes(config: FormConfig): string[] {
  return [...new Set(collectFieldTypes(config.fields))];
}

describe("landing-page scoped field registration", () => {
  it("LandingDemoForm registers every field type landingDemoConfig uses", () => {
    for (const type of configFieldTypes(landingDemoConfig)) {
      expect(LANDING_DEMO_REGISTERED_TYPES).toContain(type);
    }
  });

  it("FlagshipSignupForm registers every field type multiStepSignupConfig uses", () => {
    for (const type of configFieldTypes(multiStepSignupConfig)) {
      expect(FLAGSHIP_REGISTERED_TYPES).toContain(type);
    }
  });
});
