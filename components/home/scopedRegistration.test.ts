import { describe, expect, it } from "vitest";
import { multiStepSignupConfig } from "@/app/(site)/examples/multi-step-signup/config";
import { type AnyFieldConfig, type FormConfig, isBuiltInField } from "@/form-builder/core/types";
import { landingDemoConfig } from "./demoConfig";
import { FLAGSHIP_REGISTERED_TYPES } from "./FlagshipSignupForm";
import { LANDING_DEMO_REGISTERED_TYPES } from "./LandingDemoForm";

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
