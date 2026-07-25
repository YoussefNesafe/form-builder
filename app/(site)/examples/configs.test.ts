import { describe, expect, it } from "vitest";
import { validateFormConfig } from "@/form-builder";
import { multiStepSignupConfig } from "./multi-step-signup/config";
import { conditionalProfileConfig } from "./conditional-profile/config";
import { advancedFieldsConfig } from "./advanced-fields/config";
import { typedSubmitConfig } from "./typed-submit/config";

describe("example configs", () => {
  it.each([
    ["multi-step-signup", multiStepSignupConfig],
    ["conditional-profile", conditionalProfileConfig],
    ["advanced-fields", advancedFieldsConfig],
    ["typed-submit", typedSubmitConfig],
  ] as const)("%s passes validateFormConfig with zero errors", (_name, config) => {
    expect(() => validateFormConfig(config)).not.toThrow();
  });
});
