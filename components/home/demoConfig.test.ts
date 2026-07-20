import { describe, expect, it } from "vitest";
import { validateFormConfig } from "@/form-builder";
import { landingDemoConfig } from "./demoConfig";

describe("landing demo config", () => {
  it("passes validateFormConfig with zero errors", () => {
    expect(() => validateFormConfig(landingDemoConfig)).not.toThrow();
  });

  it("keeps the visibleWhen showcase the demo exists for", () => {
    const companyName = landingDemoConfig.fields.find((f) => f.name === "companyName");
    expect(companyName?.visibleWhen).toEqual({ field: "accountType", equals: "company" });
  });
});
