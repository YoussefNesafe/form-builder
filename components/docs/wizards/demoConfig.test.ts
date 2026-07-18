import { describe, expect, it } from "vitest";
import { validateFormConfig } from "@/form-builder";
import { wizardDemoConfig } from "./demoConfig";

describe("wizards docs demo config", () => {
  it("passes validateFormConfig with zero errors", () => {
    expect(() => validateFormConfig(wizardDemoConfig)).not.toThrow();
  });

  it("keeps the 2-step + review shape the page explains", () => {
    expect(wizardDemoConfig.steps).toEqual([
      { title: "Account", fieldNames: ["fullName", "email"] },
      { title: "Plan", fieldNames: ["plan"] },
      { title: "Review", review: true },
    ]);
  });

  // Pins the claim on the page: static fields are NOT step-exempt (only
  // hidden and submit are) — an unstepped static field must fail validation.
  it("rejects a static field not assigned to any step", () => {
    const withUnsteppedStatic = {
      ...wizardDemoConfig,
      id: "wizard-unstepped-static",
      fields: [
        ...wizardDemoConfig.fields,
        { type: "static" as const, name: "note", content: "Not assigned to a step" },
      ],
    };
    expect(() => validateFormConfig(withUnsteppedStatic)).toThrow(/not assigned to any step/);
  });
});
