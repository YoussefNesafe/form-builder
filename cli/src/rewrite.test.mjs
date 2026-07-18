import path from "node:path";
import { describe, expect, it } from "vitest";
import { assertNoResidualAlias, relativeSpecifier, rewriteAliasImports } from "./rewrite.mjs";

const FORM_BUILDER_ROOT = path.join("C:", "consumer", "src", "form-builder");

/**
 * Gate (f): asserts the rewrite pass produces ZERO residual `@/` alias
 * imports, so the single-folder install stays self-contained even if a
 * future field/primitive introduces a new `@/components/ui/*` or
 * `@/lib/utils` import shape. Also pins the concrete relative paths for the
 * two real shapes this rewrite has to handle: an engine/field file
 * reaching OUT to the primitives folder, and a primitive reaching to a
 * SIBLING primitive or to the vendored `cn` helper.
 */
describe("rewriteAliasImports", () => {
  it("rewrites @/components/ui/X from a field file to a relative path into components/ui/", () => {
    const targetFile = path.join(FORM_BUILDER_ROOT, "fields", "TextField.tsx");
    const source = `import { Button } from "@/components/ui/button";\nimport { Input } from "@/components/ui/input";\n`;

    const out = rewriteAliasImports(source, targetFile, FORM_BUILDER_ROOT);

    expect(out).toContain('from "../components/ui/button"');
    expect(out).toContain('from "../components/ui/input"');
    expect(out).not.toMatch(/@\/components\/ui/);
  });

  it("rewrites @/components/ui/X from an engine file (one level deeper) correctly", () => {
    const targetFile = path.join(FORM_BUILDER_ROOT, "ui", "FieldWrapper.tsx");
    const source = `import { Field } from "@/components/ui/field";\n`;

    const out = rewriteAliasImports(source, targetFile, FORM_BUILDER_ROOT);

    expect(out).toContain('from "../components/ui/field"');
  });

  it("rewrites a primitive's cross-reference to a sibling primitive as ./X", () => {
    const targetFile = path.join(FORM_BUILDER_ROOT, "components", "ui", "command.tsx");
    const source = `import { Dialog } from "@/components/ui/dialog";\nimport { InputGroup } from "@/components/ui/input-group";\n`;

    const out = rewriteAliasImports(source, targetFile, FORM_BUILDER_ROOT);

    expect(out).toContain('from "./dialog"');
    expect(out).toContain('from "./input-group"');
  });

  it("rewrites @/lib/utils from a primitive to the vendored internal/cn, keeping the named cn import", () => {
    const targetFile = path.join(FORM_BUILDER_ROOT, "components", "ui", "button.tsx");
    const source = `import { cn } from "@/lib/utils";\n`;

    const out = rewriteAliasImports(source, targetFile, FORM_BUILDER_ROOT);

    expect(out).toBe(`import { cn } from "../../internal/cn";\n`);
    expect(out).not.toMatch(/@\/lib\/utils/);
  });

  it("leaves existing relative imports and unrelated code completely untouched", () => {
    const targetFile = path.join(FORM_BUILDER_ROOT, "fields", "TextField.tsx");
    const source = [
      `import { getPasswordChecks } from "../core/password";`,
      `import { FieldWrapper } from "../ui/FieldWrapper";`,
      `import { useOtpFlow } from "../hooks/useOtpFlow";`,
    ].join("\n");

    const out = rewriteAliasImports(source, targetFile, FORM_BUILDER_ROOT);

    expect(out).toContain('from "../core/password"');
    expect(out).toContain('from "../ui/FieldWrapper"');
    expect(out).toContain('from "../hooks/useOtpFlow"');
  });

  it("produces zero residual @/components/ui or @/lib/utils occurrences for a file using both, from any nesting depth", () => {
    const samples = [
      { rel: ["fields", "CountryField.tsx"], content: `import { Button } from "@/components/ui/button";\nimport { cn } from "@/lib/utils";\n` },
      { rel: ["components", "ui", "field.tsx"], content: `import { Label } from "@/components/ui/label";\nimport { cn } from "@/lib/utils";\n` },
      { rel: ["ui", "FieldWrapper.tsx"], content: `import { Field } from "@/components/ui/field";\n` },
    ];

    for (const { rel, content } of samples) {
      const targetFile = path.join(FORM_BUILDER_ROOT, ...rel);
      const out = rewriteAliasImports(content, targetFile, FORM_BUILDER_ROOT);
      expect(out, `${rel.join("/")} still has an @/ alias after rewrite`).not.toMatch(/@\/(components\/ui|lib\/utils)/);
    }
  });

  it("relativeSpecifier always starts with a dot", () => {
    const a = path.join(FORM_BUILDER_ROOT, "fields", "TextField.tsx");
    const b = path.join(FORM_BUILDER_ROOT, "components", "ui", "button");
    expect(relativeSpecifier(a, b).startsWith(".")).toBe(true);
  });

  // MINOR: components/FormStepper.tsx lives INSIDE components/, the same
  // directory that contains the ui/ subfolder — so its rewritten path is
  // the shorter "./ui/button", not "../components/ui/button" (the shape
  // every fields/*.tsx file needs). A relativeSpecifier regression that
  // over-generalizes to always prefixing "../components" would pass every
  // other test above and still be wrong here.
  it("rewrites @/components/ui/X from components/FormStepper.tsx (sibling to components/ui/) as ./ui/X, not ../components/ui/X", () => {
    const targetFile = path.join(FORM_BUILDER_ROOT, "components", "FormStepper.tsx");
    const source = `import { Button } from "@/components/ui/button";\n`;

    const out = rewriteAliasImports(source, targetFile, FORM_BUILDER_ROOT);

    expect(out).toContain('from "./ui/button"');
    expect(out).not.toContain("../components/ui/button");
  });
});

describe("assertNoResidualAlias", () => {
  it("throws a clear, file-naming error when a residual @/ alias survives the rewrite", () => {
    // rewriteAliasImports only knows @/components/ui/* and @/lib/utils —
    // a hypothetical future @/lib/formatDate import (or any other @/ alias)
    // passes through untouched, exactly like the real bug this guards.
    const source = `import { formatDate } from "@/lib/formatDate";\n`;

    expect(() => assertNoResidualAlias(source, "fields/TextField.tsx")).toThrow(/unrewritten alias import "@\/lib\/formatDate".*fields\/TextField\.tsx/);
  });

  it("does not throw once rewriteAliasImports has actually rewritten every known alias", () => {
    const targetFile = path.join(FORM_BUILDER_ROOT, "fields", "TextField.tsx");
    const source = `import { Button } from "@/components/ui/button";\nimport { cn } from "@/lib/utils";\n`;
    const rewritten = rewriteAliasImports(source, targetFile, FORM_BUILDER_ROOT);

    expect(() => assertNoResidualAlias(rewritten, "fields/TextField.tsx")).not.toThrow();
  });
});
