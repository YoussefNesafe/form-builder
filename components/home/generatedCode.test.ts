import { describe, expect, it } from "vitest";
import { multiStepSignupConfig } from "@/app/(site)/examples/multi-step-signup/config";
import { toTs } from "@/components/builder/model/serializeCode";
import { landingDemoConfig } from "./demoConfig";
import { FLAGSHIP_CODE, FINAL_CTA_CODE } from "./generatedCode";

describe("landing page generated code panes", () => {
  it("flagship pane is byte-identical to the real serializer's output for multiStepSignupConfig", () => {
    expect(FLAGSHIP_CODE).toBe(toTs(multiStepSignupConfig));
  });

  it("final CTA snippet is byte-identical to the real serializer's output for landingDemoConfig", () => {
    expect(FINAL_CTA_CODE).toBe(toTs(landingDemoConfig));
  });

  it("flagship pane names every multiStepSignupConfig field — fails loud if the config drifts from the pane", () => {
    for (const field of multiStepSignupConfig.fields) {
      expect(FLAGSHIP_CODE).toContain(`"name": "${field.name}"`);
    }
  });
});
