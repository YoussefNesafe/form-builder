import { describe, expect, it } from "vitest";
import { validateFormConfig } from "@/form-builder/core/schema";
import { conditionsDemoConfig } from "./demoConfig";

describe("conditions docs demo config", () => {
  it("passes validateFormConfig with zero errors", () => {
    expect(() => validateFormConfig(conditionsDemoConfig)).not.toThrow();
  });

  it("keeps the visibleWhen showcase the page explains", () => {
    const companyName = conditionsDemoConfig.fields.find((f) => f.name === "companyName");
    expect(companyName?.visibleWhen).toEqual({ field: "accountType", equals: "company" });
  });
});
