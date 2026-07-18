import { describe, expect, it } from "vitest";
import { buildRegistryModel } from "../../scripts/build-registry.mjs";
import { planInstall } from "./plan.mjs";

/**
 * Ported from the earlier scripts/form-builder-add.test.mjs (the shadcn-add-
 * based installer this CLI replaces) — the closure math these tests pin
 * didn't change when install.mjs switched to direct copy + import-rewrite.
 *
 * Locks the BLOCKER fix in resolveInstallSet(): a single-field install must
 * pull in form-engine's OWN primitive closure (fb-ui-field, from
 * ui/FieldWrapper.tsx; fb-ui-button/fb-ui-separator, from
 * components/FormStepper.tsx and components/ReviewStep.tsx), not just the
 * requested field's directly-imported primitives. "text" is a good
 * regression case: TextField itself only needs button/input/textarea — it
 * never imports "field" or "separator" — so before the fix, a partial
 * install of "text" alone would land form-engine's FieldWrapper.tsx and
 * ReviewStep.tsx with unresolved @/components/ui/field and
 * @/components/ui/separator imports.
 */
describe("form-builder CLI planInstall", () => {
  const model = buildRegistryModel();

  it("a single-field install pulls form-engine's own primitive closure, not just the field's", () => {
    const plan = planInstall(["text"], { includeTheme: false, model });

    expect(plan).toContain("form-engine");
    expect(plan).toContain("field-text");
    // TextField's own primitives.
    expect(plan).toContain("fb-ui-button");
    expect(plan).toContain("fb-ui-input");
    expect(plan).toContain("fb-ui-textarea");
    // form-engine's primitives (FieldWrapper -> field -> label/separator;
    // FormStepper -> button; ReviewStep -> button/separator) — the BLOCKER.
    expect(plan).toContain("fb-ui-field");
    expect(plan).toContain("fb-ui-separator");
    expect(plan).toContain("fb-ui-label");
  });

  it("every field that needs form-engine gets form-engine's full primitive closure in its plan", () => {
    for (const [itemName, info] of model.fields) {
      if (!info.needsEngine) continue;
      const plan = planInstall([itemName.replace(/^field-/, "")], { includeTheme: false, model });
      for (const name of model.engine.uiDeps) {
        expect(plan, `${itemName}'s plan is missing fb-ui-${name} (from form-engine)`).toContain(`fb-ui-${name}`);
      }
    }
  });

  it("accepts either the short name or the full item name", () => {
    const short = planInstall(["phone"], { includeTheme: false, model });
    const full = planInstall(["field-phone"], { includeTheme: false, model });
    expect(short).toEqual(full);
  });

  it("includeTheme adds fb-theme, includeTheme:false omits it", () => {
    const withTheme = planInstall(["text"], { includeTheme: true, model });
    const withoutTheme = planInstall(["text"], { includeTheme: false, model });
    expect(withTheme).toContain("fb-theme");
    expect(withoutTheme).not.toContain("fb-theme");
  });

  it('"all" resolves to every field, form-engine, every primitive any field needs, and the aggregate item', () => {
    const plan = planInstall(["all"], { includeTheme: true, model });
    expect(plan).toContain("form-builder");
    expect(plan).toContain("form-engine");
    for (const itemName of model.fields.keys()) expect(plan).toContain(itemName);
  });

  it("throws a clear error for an unknown field name", () => {
    expect(() => planInstall(["not-a-real-field"], { includeTheme: false, model })).toThrow(/unknown field item/);
  });
});
