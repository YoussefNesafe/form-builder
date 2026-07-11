import { describe, expect, it } from "vitest";
import type { FormConfig } from "@/form-builder";
import { validateFormConfig } from "@/form-builder/core/schema";
import { landingDemoConfig } from "./config";

describe("landing demo config", () => {
  it("passes validateFormConfig with zero errors", () => {
    expect(() => validateFormConfig(landingDemoConfig)).not.toThrow();
  });

  it("keeps the visibleWhen showcase the demo exists for", () => {
    const companyName = landingDemoConfig.fields.find((f) => f.name === "companyName");
    expect(companyName?.visibleWhen).toEqual({ field: "accountType", equals: "company" });
  });
});

// Typed mirror of the CODE_SNIPPET marketing string on app/page.tsx. If this
// stops compiling or validating, the landing page's "Exported code" pane is
// lying about the public API — update both together.
const codeSnippetMirror: FormConfig = {
  id: "signup",
  fields: [
    { type: "email", name: "email", label: "Email", required: true },
    { type: "password", name: "password", label: "Password", required: true },
    { type: "country", name: "country", label: "Country" },
    { type: "submit", name: "submit", text: "Create account" },
  ],
};

describe("landing code snippet mirror", () => {
  it("matches a config the engine actually accepts", () => {
    expect(() => validateFormConfig(codeSnippetMirror)).not.toThrow();
  });
});
