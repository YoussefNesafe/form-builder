import { describe, expect, it } from "vitest";
import { validateFormConfig } from "@/form-builder";
import { landingDemoConfig } from "./demoConfig";

// The landing page no longer carries a hand-maintained marketing code
// string — both landing code panes (flagship, final CTA) are generated from
// real configs via the builder's own serializer. See generatedCode.ts and
// generatedCode.test.ts for that pin.
describe("landing demo config", () => {
  it("passes validateFormConfig with zero errors", () => {
    expect(() => validateFormConfig(landingDemoConfig)).not.toThrow();
  });

  it("keeps the visibleWhen showcase the demo exists for", () => {
    const companyName = landingDemoConfig.fields.find((f) => f.name === "companyName");
    expect(companyName?.visibleWhen).toEqual({ field: "accountType", equals: "company" });
  });
});
