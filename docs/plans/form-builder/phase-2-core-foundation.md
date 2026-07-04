# Phase 2 — Core Foundation

> Part of `docs/plans/2026-07-05-form-builder-implementation.md`. Read overview rules first.

## Task 2.1: core/types.ts

**Files:** Create `form-builder/core/types.ts`

Complete content — spec types verbatim plus resolved gaps (design doc "Spec gap resolutions"):

```ts
export type Option = { label: string; value: string | number; disabled?: boolean };

export type TextRules = {
  minLength?: number;
  maxLength?: number;
  pattern?: string; // string, not RegExp — JSON-serializable
  message?: string; // custom error for pattern
};

export type ButtonVariant = "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";

export type Condition = {
  field: string;
  equals?: unknown;
  notEquals?: unknown;
  in?: unknown[];
};

export type BaseField = {
  name: string;
  label?: string;
  description?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  visibleWhen?: Condition;
  disabledWhen?: Condition;
  colSpan?: 1 | 2 | 3 | 4;
};

export type FieldConfig =
  | (BaseField & { type: "text" | "email" | "password" | "textarea"; rules?: TextRules })
  | (BaseField & { type: "number"; min?: number; max?: number; step?: number })
  | (BaseField & { type: "otp"; length: number })
  | (BaseField & { type: "phone"; defaultCountry?: string; preferredCountries?: string[] })
  | (BaseField & { type: "select"; options: Option[]; searchable?: boolean; multiple?: boolean })
  | (BaseField & { type: "radio"; options: Option[] })
  | (BaseField & { type: "checkbox" | "switch"; options?: Option[] }) // options => checkbox group
  | (BaseField & { type: "date"; range?: boolean; minDate?: string; maxDate?: string })
  | (BaseField & { type: "slider"; min: number; max: number; step?: number })
  | (BaseField & { type: "file"; accept?: string; maxSizeMB?: number; multiple?: boolean })
  | (BaseField & { type: "hidden"; value: unknown })
  | (BaseField & { type: "static"; content: string; as?: "h1" | "h2" | "p" | "divider" })
  | (BaseField & { type: "group"; fields: FieldConfig[]; min?: number; max?: number })
  | (BaseField & { type: "submit"; text: string; variant?: ButtonVariant });

export type FieldType = FieldConfig["type"];

export type FormConfig = {
  id: string;
  title?: string;
  description?: string;
  fields: FieldConfig[];
  steps?: { title: string; fieldNames: string[] }[];
};

export type FormValues = Record<string, unknown>;
```

**Steps:** write file → `yarn tsc --noEmit` → commit `feat: add form-builder core types`.

## Task 2.2: core/schema.ts (config self-validation, TDD)

**Files:** Create `form-builder/core/schema.test.ts`, then `form-builder/core/schema.ts`

**Step 1 — failing tests** (`schema.test.ts`):
```ts
import { describe, expect, it } from "vitest";
import { validateFormConfig } from "./schema";
import type { FormConfig } from "./types";

const valid: FormConfig = {
  id: "t",
  fields: [
    { type: "text", name: "first" },
    { type: "select", name: "color", options: [{ label: "Red", value: "red" }] },
    { type: "group", name: "team", fields: [{ type: "text", name: "member" }] },
  ],
};

describe("validateFormConfig", () => {
  it("accepts a valid config", () => expect(() => validateFormConfig(valid)).not.toThrow());
  it("rejects missing name", () =>
    expect(() => validateFormConfig({ id: "t", fields: [{ type: "text" } as never] })).toThrow(/name/));
  it("rejects unknown type", () =>
    expect(() => validateFormConfig({ id: "t", fields: [{ type: "wat", name: "x" } as never] })).toThrow(/wat/));
  it("rejects duplicate names at same level", () =>
    expect(() =>
      validateFormConfig({ id: "t", fields: [{ type: "text", name: "a" }, { type: "text", name: "a" }] }),
    ).toThrow(/duplicate/i));
  it("rejects otp without length", () =>
    expect(() => validateFormConfig({ id: "t", fields: [{ type: "otp", name: "code" } as never] })).toThrow());
  it("recurses into groups", () =>
    expect(() =>
      validateFormConfig({
        id: "t",
        fields: [{ type: "group", name: "g", fields: [{ type: "text" } as never] }],
      }),
    ).toThrow(/name/));
  it("rejects steps referencing unknown fieldNames", () =>
    expect(() =>
      validateFormConfig({ ...valid, steps: [{ title: "s1", fieldNames: ["nope"] }] }),
    ).toThrow(/nope/));
});
```

**Step 2:** `yarn test` → FAIL (module missing).

**Step 3 — implement** `schema.ts`: zod discriminated union on `type` mirroring `FieldConfig` (use `z.lazy` for group recursion), plus `.superRefine` for duplicate names and step fieldName references. Export:
```ts
export function validateFormConfig(config: FormConfig): void {
  if (process.env.NODE_ENV === "production") return;
  // parse with formConfigSchema; on failure throw Error with readable path + message
}
```
Error text must name offending field path (zod issue `path` join) so bad configs are debuggable.

**Step 4:** `yarn test` → PASS. **Step 5:** Commit `feat: validate form config shape at dev time`.

## Task 2.3: core/registry.ts (TDD)

**Files:** `form-builder/core/registry.test.ts`, `form-builder/core/registry.ts`

**Step 1 — failing tests:** register component → `getField` returns it; unknown type → `undefined`; re-register overrides (custom project fields override built-ins); `getRegisteredTypes()` lists keys.

**Step 2:** `yarn test` → FAIL.

**Step 3 — implement:**
```ts
import type { ComponentType } from "react";
import type { FieldConfig } from "./types";

export type FieldComponentProps = { field: FieldConfig };

const registry = new Map<string, ComponentType<FieldComponentProps>>();

export function registerField(type: string, component: ComponentType<FieldComponentProps>): void {
  registry.set(type, component);
}
export function getField(type: string): ComponentType<FieldComponentProps> | undefined {
  return registry.get(type);
}
export function getRegisteredTypes(): string[] {
  return [...registry.keys()];
}
```

**Step 4:** `yarn test` → PASS. **Step 5:** Commit: `feat: add field registry`.
