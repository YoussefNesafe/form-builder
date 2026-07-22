# Type-Safe Config Spine Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Infer a typed value shape from a `const FormConfig` so hand-authored configs get autocomplete, a typed submit payload, and a typed submit→backend wire — zero runtime cost, fully back-compatible.

**Architecture:** A `defineForm()` identity helper captures config literals via a `const` type param. A types-only `InferValues<C>` conditional-type mapper walks the field tuple and maps each field's `type` → value type, keyed by `name`. Existing runtime entry points (`FormRenderer`, `useDynamicForm`, `parseSubmission`, `applyServerErrors`) gain an optional generic defaulting to the loose `FormValues`, so untyped callers are unaffected. A thin `createFormAction` helper carries the inferred type end to end. Value inference ships before field-name-reference constraints (phased).

**Tech Stack:** TypeScript 6, Zod 4, React Hook Form 7, Vitest 4 (`expectTypeOf` for type-level tests), Next.js 16.

**Design doc:** `docs/plans/2026-07-23-type-safe-config-spine-design.md`

**Conventions:** DRY, YAGNI, TDD, commit per task. Type-level behavior is pinned with `expectTypeOf` — it is the primary regression guard since types have no runtime. Run the full suite with `yarn test`; a single file with `yarn test <path>`.

---

## Phase 1 — Inference core

### Task 1: `defineForm` identity helper

**Files:**
- Create: `form-builder/core/defineForm.ts`
- Test: `form-builder/core/defineForm.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, it, expect, expectTypeOf } from "vitest";
import { defineForm } from "./defineForm";
import type { FormConfig } from "./types";

describe("defineForm", () => {
  it("returns the config argument unchanged at runtime", () => {
    const cfg = { id: "f", fields: [{ name: "email", type: "email" }] } as const;
    expect(defineForm(cfg)).toBe(cfg);
  });

  it("preserves the literal type (const type param)", () => {
    const cfg = defineForm({ id: "f", fields: [{ name: "email", type: "email" }] });
    expectTypeOf(cfg.fields[0].name).toEqualTypeOf<"email">();
    expectTypeOf(cfg).toMatchTypeOf<FormConfig>();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `yarn test form-builder/core/defineForm.test.ts`
Expected: FAIL — `Cannot find module './defineForm'`.

**Step 3: Write minimal implementation**

```ts
// form-builder/core/defineForm.ts
import type { FormConfig } from "./types";

/** Identity helper. Captures config literals so `InferValues<typeof cfg>` can
 *  read field `name`/`type`. Zero runtime — returns its argument unchanged. */
export const defineForm = <const C extends FormConfig>(config: C): C => config;
```

**Step 4: Run test to verify it passes**

Run: `yarn test form-builder/core/defineForm.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add form-builder/core/defineForm.ts form-builder/core/defineForm.test.ts
git commit -m "feat(core): add defineForm identity helper"
```

---

### Task 2: `InferValues` — scalar field types

**Files:**
- Create: `form-builder/core/inferValues.ts`
- Test: `form-builder/core/inferValues.test-d.ts`

**Step 1: Write the failing type test**

```ts
import { describe, it, expectTypeOf } from "vitest";
import { defineForm } from "./defineForm";
import type { InferValues } from "./inferValues";

describe("InferValues — scalars", () => {
  it("maps string-valued field types to string", () => {
    const cfg = defineForm({
      id: "f",
      fields: [
        { name: "a", type: "text" },
        { name: "b", type: "email", required: true },
        { name: "c", type: "number", required: true },
        { name: "d", type: "rating", required: true },
      ],
    });
    type V = InferValues<typeof cfg>;
    expectTypeOf<V["b"]>().toEqualTypeOf<string>();
    expectTypeOf<V["c"]>().toEqualTypeOf<number>();
    expectTypeOf<V["d"]>().toEqualTypeOf<number>();
  });
});
```

**Step 2: Run to verify it fails**

Run: `yarn test form-builder/core/inferValues.test-d.ts`
Expected: FAIL — `Cannot find module './inferValues'`.

**Step 3: Write minimal implementation**

```ts
// form-builder/core/inferValues.ts
import type { AnyFieldConfig, FormConfig } from "./types";

type StringField =
  | "text" | "email" | "textarea" | "password" | "masked"
  | "otp" | "phone" | "country" | "radio" | "segmented"
  | "signature" | "date" | "time";
type NumberField = "number" | "slider" | "rating";

/** Value type for a single field, ignoring name/optionality (added by the walker). */
export type FieldValue<F extends AnyFieldConfig> =
  F extends { type: StringField } ? string :
  F extends { type: NumberField } ? number :
  unknown;

/** Fields that contribute a key to the payload (static/submit do not). */
type ValueField<F extends AnyFieldConfig> =
  F extends { type: "static" | "submit" } ? never : F;

type NamedValues<Fields extends readonly AnyFieldConfig[]> = {
  [F in Extract<Fields[number], ValueField<Fields[number]>> as F["name"]]: FieldValue<F>;
};

export type InferValues<C extends FormConfig> = NamedValues<C["fields"]>;
```

**Step 4: Run to verify it passes**

Run: `yarn test form-builder/core/inferValues.test-d.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add form-builder/core/inferValues.ts form-builder/core/inferValues.test-d.ts
git commit -m "feat(core): InferValues scalar field mapping"
```

---

### Task 3: `InferValues` — collections & special shapes

Covers: checkbox/switch (boolean vs `string[]`), `select`/checkbox/switch `multiple` → `string[]`, `date` `range` → `[string, string]`, `file` → `File | File[]`, `group` → `Array<InferValues<fields>>`, `hidden` → value type, custom type → `unknown`.

**Files:**
- Modify: `form-builder/core/inferValues.ts`
- Modify: `form-builder/core/inferValues.test-d.ts`

**Step 1: Add failing type assertions**

```ts
it("maps collection and special shapes", () => {
  const cfg = defineForm({
    id: "f",
    fields: [
      { name: "agree", type: "checkbox", required: true },
      { name: "tags", type: "checkbox", required: true, options: [{ label: "A", value: "a" }] },
      { name: "picks", type: "select", required: true, multiple: true, options: [] },
      { name: "range", type: "date", required: true, range: true },
      { name: "doc", type: "file", required: true, multiple: true },
      {
        name: "rows", type: "group", required: true,
        fields: [{ name: "qty", type: "number", required: true }],
      },
    ],
  });
  type V = InferValues<typeof cfg>;
  expectTypeOf<V["agree"]>().toEqualTypeOf<boolean>();
  expectTypeOf<V["tags"]>().toEqualTypeOf<string[]>();
  expectTypeOf<V["picks"]>().toEqualTypeOf<string[]>();
  expectTypeOf<V["range"]>().toEqualTypeOf<[string, string]>();
  expectTypeOf<V["doc"]>().toEqualTypeOf<File | File[]>();
  expectTypeOf<V["rows"]>().toEqualTypeOf<{ qty: number }[]>();
});
```

**Step 2: Run to verify it fails**

Run: `yarn test form-builder/core/inferValues.test-d.ts`
Expected: FAIL — assertions mismatch (`unknown` returned).

**Step 3: Extend `FieldValue`**

Add branches BEFORE the `StringField` branch (order matters — `date range` must beat `date`):

```ts
export type FieldValue<F extends AnyFieldConfig> =
  F extends { type: "checkbox" | "switch"; options: readonly unknown[] } ? string[] :
  F extends { type: "checkbox" | "switch" } ? boolean :
  F extends { type: "select"; multiple: true } ? string[] :
  F extends { type: "date"; range: true } ? [string, string] :
  F extends { type: "file"; multiple: true } ? File[] :
  F extends { type: "file" } ? File | File[] :
  F extends { type: "group"; fields: infer GF extends readonly AnyFieldConfig[] }
    ? NamedValues<GF>[] :
  F extends { type: "hidden"; value: infer V } ? V :
  F extends { type: StringField } ? string :
  F extends { type: NumberField } ? number :
  unknown; // custom registered types
```

Note: `file` single = `File | File[]` matches the design table; only `multiple:true` narrows to `File[]`.

**Step 4: Run to verify it passes**

Run: `yarn test form-builder/core/inferValues.test-d.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add form-builder/core/inferValues.ts form-builder/core/inferValues.test-d.ts
git commit -m "feat(core): InferValues collections, groups, files"
```

---

### Task 4: Conditional-visibility → optional key

Fields with `visibleWhen` or `enabledWhenVerified` may be stripped by `parseSubmission`, so their keys are optional in the payload.

**Files:**
- Modify: `form-builder/core/inferValues.ts`
- Modify: `form-builder/core/inferValues.test-d.ts`

**Step 1: Add failing assertion**

```ts
it("marks conditionally-visible fields optional", () => {
  const cfg = defineForm({
    id: "f",
    fields: [
      { name: "always", type: "text", required: true },
      { name: "maybe", type: "text", required: true, visibleWhen: { field: "always", equals: "x" } },
    ],
  });
  type V = InferValues<typeof cfg>;
  // `always` present, `maybe` optional:
  expectTypeOf<V>().toEqualTypeOf<{ always: string; maybe?: string }>();
});
```

**Step 2: Run to verify it fails**

Run: `yarn test form-builder/core/inferValues.test-d.ts`
Expected: FAIL — `maybe` typed as required.

**Step 3: Split walker into required vs optional halves**

```ts
type IsConditional<F> = F extends { visibleWhen: unknown } ? true
  : F extends { enabledWhenVerified: unknown } ? true : false;

type RequiredFields<Fs extends readonly AnyFieldConfig[]> =
  Extract<Fs[number], ValueField<Fs[number]>> extends infer F
    ? F extends AnyFieldConfig ? (IsConditional<F> extends true ? never : F) : never
    : never;
type OptionalFields<Fs extends readonly AnyFieldConfig[]> =
  Extract<Fs[number], ValueField<Fs[number]>> extends infer F
    ? F extends AnyFieldConfig ? (IsConditional<F> extends true ? F : never) : never
    : never;

type NamedValues<Fs extends readonly AnyFieldConfig[]> =
  { [F in RequiredFields<Fs> as F["name"]]: FieldValue<F> } &
  { [F in OptionalFields<Fs> as F["name"]]?: FieldValue<F> };
```

(If the intersection prints unreadably in editor hovers, wrap in a `Prettify<T> = { [K in keyof T]: T[K] } & {}` helper and export `InferValues = Prettify<NamedValues<...>>`.)

**Step 4: Run to verify it passes**

Run: `yarn test form-builder/core/inferValues.test-d.ts`
Expected: PASS. Re-run the full file — Tasks 2–3 assertions still green.

**Step 5: Commit**

```bash
git add form-builder/core/inferValues.ts form-builder/core/inferValues.test-d.ts
git commit -m "feat(core): conditional fields optional in InferValues"
```

---

### Task 5: `FieldNames` union

**Files:**
- Modify: `form-builder/core/inferValues.ts`
- Modify: `form-builder/core/inferValues.test-d.ts`

**Step 1: Add failing assertion**

```ts
it("exposes the field-name union", () => {
  const cfg = defineForm({
    id: "f",
    fields: [
      { name: "email", type: "email" },
      { name: "age", type: "number" },
      { name: "hr", type: "static", content: "x" },
    ],
  });
  // static IS a real field name (name-reference targets), unlike value keys:
  expectTypeOf<FieldNames<typeof cfg>>().toEqualTypeOf<"email" | "age" | "hr">();
});
```

Add `import type { InferValues, FieldNames } from "./inferValues";`.

**Step 2: Run to verify it fails**

Run: `yarn test form-builder/core/inferValues.test-d.ts`
Expected: FAIL — `FieldNames` not exported.

**Step 3: Implement**

```ts
export type FieldNames<C extends FormConfig> = C["fields"][number]["name"];
```

**Step 4: Run to verify it passes**

Run: `yarn test form-builder/core/inferValues.test-d.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add form-builder/core/inferValues.ts form-builder/core/inferValues.test-d.ts
git commit -m "feat(core): FieldNames union type"
```

---

## Phase 2 — Thread the type through runtime entry points

### Task 6: Barrel exports + generic on `parseSubmission`

**Files:**
- Modify: `form-builder/index.ts`
- Modify: `form-builder/core/parseSubmission.ts`
- Test: `form-builder/core/parseSubmission.test-d.ts` (new)

**Step 1: Write failing type test**

```ts
import { describe, it, expectTypeOf } from "vitest";
import { defineForm } from "./defineForm";
import { parseSubmission } from "./parseSubmission";
import type { InferValues } from "./inferValues";

describe("parseSubmission typing", () => {
  it("returns typed data on success", () => {
    const cfg = defineForm({ id: "f", fields: [{ name: "email", type: "email", required: true }] });
    const result = parseSubmission(cfg, {}, {});
    if (result.ok) {
      expectTypeOf(result.data).toEqualTypeOf<InferValues<typeof cfg>>();
    }
  });
});
```

**Step 2: Run to verify it fails**

Run: `yarn test form-builder/core/parseSubmission.test-d.ts`
Expected: FAIL — `result.data` is `FormValues`, not `InferValues<typeof cfg>`.

**Step 3: Make `parseSubmission` generic**

- Locate the `ParseSubmissionResult` type. Add a type param defaulting to `FormValues`:
  ```ts
  export type ParseSubmissionResult<V = FormValues> =
    | { ok: true; data: V }
    | { ok: false; errors: ServerErrorResult; code: ParseSubmissionErrorCode };
  ```
  (Match the existing failure-branch shape exactly — read the current definition and only add `<V = FormValues>` + swap the success `data` type to `V`.)
- Change the function signature:
  ```ts
  export function parseSubmission<C extends FormConfig>(
    config: C, body: unknown, opts?: ParseSubmissionOptions,
  ): ParseSubmissionResult<InferValues<C>> { /* body unchanged */ }
  ```
  Add `import type { InferValues } from "./inferValues";`. The runtime body does not change — only the cast on the returned `data` (use `as InferValues<C>` at the single success return site).

**Step 4: Add the new exports and run all tests**

In `form-builder/index.ts` add:
```ts
export { defineForm } from "./core/defineForm";
export type { InferValues, FieldNames, FieldValue } from "./core/inferValues";
```

Run: `yarn test form-builder/core/parseSubmission.test-d.ts` → PASS.
Run: `yarn test` → the existing `parseSubmission` runtime tests still PASS (no runtime behavior changed).

**Step 5: Commit**

```bash
git add form-builder/index.ts form-builder/core/parseSubmission.ts form-builder/core/parseSubmission.test-d.ts
git commit -m "feat(core): typed parseSubmission result + barrel exports"
```

---

### Task 7: Generic on `FormRenderer` + `useDynamicForm`

**Files:**
- Modify: `form-builder/components/FormRenderer.tsx`
- Modify: `form-builder/hooks/useDynamicForm.ts`
- Test: `form-builder/components/FormRenderer.test-d.tsx` (new)

**Step 1: Write failing type test**

```tsx
import { describe, it, expectTypeOf } from "vitest";
import { defineForm } from "../core/defineForm";
import type { InferValues } from "../core/inferValues";
import { FormRenderer } from "./FormRenderer";

describe("FormRenderer onSubmit typing", () => {
  it("infers the submit payload from config", () => {
    const cfg = defineForm({ id: "f", fields: [{ name: "email", type: "email", required: true }] });
    // Extract the onSubmit param type for the given config generic:
    type OnSubmit = React.ComponentProps<typeof FormRenderer<typeof cfg>>["onSubmit"];
    type Payload = OnSubmit extends (v: infer V) => unknown ? V : never;
    expectTypeOf<Payload>().toEqualTypeOf<InferValues<typeof cfg>>();
  });
});
```

**Step 2: Run to verify it fails**

Run: `yarn test form-builder/components/FormRenderer.test-d.tsx`
Expected: FAIL — payload resolves to `FormValues`.

**Step 3: Add the generic**

- `FormRenderer`: change the component to `function FormRenderer<C extends FormConfig = FormConfig>(props: FormRendererProps<C>)`. Make `FormRendererProps` generic; `config: C`; `onSubmit?: (values: InferValues<C>) => void | Promise<void>`. Every internal use of `FormValues` for the submit payload becomes `InferValues<C>` (cast at the RHF `handleSubmit` boundary — RHF's internal type stays loose, cast once where values leave the resolver).
- `useDynamicForm`: add `<C extends FormConfig = FormConfig>`, `config: C`, and type the returned `values`/submit boundary as `InferValues<C>`. Internal RHF wiring untouched; cast at the exposed boundary only.
- Default generic (`= FormConfig`) keeps all existing untyped call sites compiling.

**Step 4: Run to verify it passes**

Run: `yarn test form-builder/components/FormRenderer.test-d.tsx` → PASS.
Run: `yarn test` (full) → all existing renderer/hook tests PASS.
Run: `yarn lint` → clean.

**Step 5: Commit**

```bash
git add form-builder/components/FormRenderer.tsx form-builder/hooks/useDynamicForm.ts form-builder/components/FormRenderer.test-d.tsx
git commit -m "feat(core): generic FormRenderer/useDynamicForm inferred payload"
```

---

### Task 8: Field-name-constrained `applyServerErrors`

**Files:**
- Modify: `form-builder/core/serverErrors.ts`
- Test: `form-builder/core/serverErrors.test-d.ts` (new)

**Step 1: Write failing type test**

```ts
import { describe, it, expectTypeOf } from "vitest";
import type { ServerErrorResult } from "./serverErrors";
import type { FieldNames } from "./inferValues";
import { defineForm } from "./defineForm";

describe("ServerErrorResult field keys", () => {
  it("constrains fieldErrors keys to real field names", () => {
    const cfg = defineForm({ id: "f", fields: [{ name: "email", type: "email" }] });
    type Keys = keyof NonNullable<ServerErrorResult<FieldNames<typeof cfg>>["fieldErrors"]>;
    expectTypeOf<Keys>().toEqualTypeOf<"email">();
  });
});
```

**Step 2: Run to verify it fails**

Run: `yarn test form-builder/core/serverErrors.test-d.ts`
Expected: FAIL — `ServerErrorResult` takes no type param.

**Step 3: Parameterize (keep default loose)**

```ts
export type ServerErrorResult<K extends string = string> = {
  fieldErrors?: Partial<Record<K, string>>;
  formError?: string;
};
```

Leave `applyServerErrors` runtime untouched; its parameter type widens to `ServerErrorResult` (default `string`) so existing callers are unaffected.

**Step 4: Run to verify it passes**

Run: `yarn test form-builder/core/serverErrors.test-d.ts` → PASS.
Run: `yarn test` → all PASS.

**Step 5: Commit**

```bash
git add form-builder/core/serverErrors.ts form-builder/core/serverErrors.test-d.ts
git commit -m "feat(core): field-name-constrained ServerErrorResult"
```

---

## Phase 3 — Submit→backend wire

### Task 9: `createFormAction` helper

Decision (design open item #2): place in a dedicated `form-builder/next/` entry so core stays framework-agnostic. Export from a sub-path, not the root barrel.

**Files:**
- Create: `form-builder/next/createFormAction.ts`
- Create: `form-builder/next/index.ts`
- Test: `form-builder/next/createFormAction.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, it, expect, expectTypeOf } from "vitest";
import { defineForm } from "../core/defineForm";
import { createFormAction } from "./createFormAction";
import type { InferValues } from "../core/inferValues";

const cfg = defineForm({ id: "f", fields: [{ name: "email", type: "email", required: true }] });

describe("createFormAction", () => {
  it("passes typed data to the handler on valid input", async () => {
    const action = createFormAction(cfg, async (data) => {
      expectTypeOf(data).toEqualTypeOf<InferValues<typeof cfg>>();
      return { ok: true as const };
    });
    const res = await action({ email: "a@b.com" });
    expect(res.ok).toBe(true);
  });

  it("short-circuits to field errors on invalid input", async () => {
    const action = createFormAction(cfg, async () => ({ ok: true as const }));
    const res = await action({ email: "" });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.errors.fieldErrors?.email).toBeTruthy();
  });

  it("funnels a handler-thrown field error into ServerErrorResult", async () => {
    const action = createFormAction(cfg, async () => {
      throw { fieldErrors: { email: "taken" } };
    });
    const res = await action({ email: "a@b.com" });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.errors.fieldErrors?.email).toBe("taken");
  });
});
```

**Step 2: Run to verify it fails**

Run: `yarn test form-builder/next/createFormAction.test.ts`
Expected: FAIL — module missing.

**Step 3: Implement**

```ts
// form-builder/next/createFormAction.ts
import { parseSubmission, type ParseSubmissionOptions } from "../core/parseSubmission";
import type { ServerErrorResult } from "../core/serverErrors";
import type { InferValues, FieldNames } from "../core/inferValues";
import type { FormConfig } from "../core/types";

export type FormActionResult<T> =
  | ({ ok: true } & T)
  | { ok: false; errors: ServerErrorResult };

/** Wrap a server handler with config-driven parsing. Parses the body via
 *  parseSubmission; on success calls `handler` with typed data; a thrown
 *  `{ fieldErrors?, formError? }` becomes a typed error result. */
export function createFormAction<C extends FormConfig, R extends { ok: true }>(
  config: C,
  handler: (data: InferValues<C>) => Promise<R>,
  opts?: ParseSubmissionOptions,
) {
  return async (body: unknown): Promise<FormActionResult<Omit<R, "ok">>> => {
    const parsed = parseSubmission(config, body, opts);
    if (!parsed.ok) return { ok: false, errors: parsed.errors };
    try {
      return await handler(parsed.data);
    } catch (e) {
      if (e && typeof e === "object" && ("fieldErrors" in e || "formError" in e)) {
        return { ok: false, errors: e as ServerErrorResult<FieldNames<C>> };
      }
      throw e; // genuine errors propagate — not swallowed
    }
  };
}
```

**Step 4: Run to verify it passes**

Run: `yarn test form-builder/next/createFormAction.test.ts` → PASS.

**Step 5: Export + commit**

`form-builder/next/index.ts`:
```ts
export { createFormAction, type FormActionResult } from "./createFormAction";
```

```bash
git add form-builder/next/
git commit -m "feat(next): createFormAction typed submit wire"
```

---

## Phase 4 — Adoption surfaces

### Task 10: Builder serializer wraps `defineForm` + emits type alias

**Files:**
- Modify: `components/builder/model/serializeCode.ts`
- Modify: `components/builder/model/serialize.test.ts` (or a co-located `serializeCode.test.ts` — match existing test file for that module)

**Step 1: Write the failing test**

Assert the emitted TS string (a) imports `defineForm`, (b) wraps the config object in `defineForm(...)`, (c) round-trips: parsing the emitted config object through `validateFormConfig` yields no errors. Model the assertion on the existing serialize test's structure.

```ts
it("wraps exported config in defineForm and imports it", () => {
  const code = serializeCode(sampleState);
  expect(code).toContain("defineForm(");
  expect(code).toMatch(/import \{[^}]*defineForm[^}]*\} from ["']form-builder["']/);
});
```

**Step 2: Run to verify it fails**

Run: `yarn test components/builder/model/serialize.test.ts`
Expected: FAIL — output is a bare object.

**Step 3: Implement**

Update the emitter so the exported config is `export const config = defineForm({ ... });` and `defineForm` is added to the `form-builder` import statement it already generates. Do not hand-write an `InferValues` string; instead emit a derived alias line: `export type Values = InferValues<typeof config>;` and add `InferValues` (type import) to the same import. Keep the single-source `fieldTypes` rule — no field copy is synthesized here.

**Step 4: Run to verify it passes**

Run: `yarn test components/builder/model/serialize.test.ts` → PASS.
Manual: open `/builder`, add a field, click "Export code", confirm the pane shows `defineForm(...)` + `Values` alias and is valid TS.

**Step 5: Commit**

```bash
git add components/builder/model/serializeCode.ts components/builder/model/serialize.test.ts
git commit -m "feat(builder): export typed defineForm config + Values alias"
```

---

### Task 11: Docs — type-safety + submit-to-backend

**Files:**
- Create: `app/(site)/docs/type-safety/page.tsx`
- Create: `app/(site)/docs/submit-to-backend/page.tsx`
- Modify: docs index/nav (`app/(site)/docs/page.tsx` and wherever the docs nav list lives — grep for an existing route slug like `"conditions"` to find it)
- Modify (copy): `locales/en/docs.ts` — add any nav labels/headings per the i18n dictionary rule (prose stays in JSX; only labels go in the dictionary)

**Step 1:** Add both pages using the existing `DocsProse` component pattern (copy the structure from `app/(site)/docs/conditions/page.tsx`). `type-safety`: authoring with `defineForm`, the value-type table, the conditional-optional rule, custom-field `unknown` escape hatch. `submit-to-backend`: the client→server→errors wire, both server-action (`createFormAction`) and route-handler (`parseSubmission` direct) variants.

**Step 2:** Add both to the docs nav and register slugs. Run `yarn dev`, visit `/docs/type-safety` and `/docs/submit-to-backend`, confirm they render and are linked.

**Step 3:** Run `yarn lint` → clean.

**Step 4: Commit**

```bash
git add "app/(site)/docs/type-safety" "app/(site)/docs/submit-to-backend" "app/(site)/docs/page.tsx" locales/en/docs.ts
git commit -m "docs: type-safety and submit-to-backend guides"
```

---

### Task 12: Example — typed form + server action

**Files:**
- Create: `app/(site)/examples/typed-submit/page.tsx`
- Create: `app/(site)/examples/typed-submit/action.ts` (server action via `createFormAction`)
- Create: `app/(site)/examples/typed-submit/config.ts` (a `defineForm(...)` config)
- Modify: examples index (`app/(site)/examples/page.tsx`)

**Step 1:** Build a small typed form reusing `ExamplePageShell` (copy structure from `app/(site)/examples/conditional-profile/page.tsx`). `config.ts` exports `defineForm(...)`; `action.ts` uses `createFormAction(config, handler)` returning a typed result and demonstrating a funneled field error; the page wires `FormRenderer<typeof config>` → action → `applyServerErrors`.

**Step 2:** Add to examples index. Run `yarn dev`, submit valid + invalid input, confirm typed payload flows and server field error lands on the field.

**Step 3:** Run `yarn test` + `yarn lint` → all clean.

**Step 4: Commit**

```bash
git add "app/(site)/examples/typed-submit" "app/(site)/examples/page.tsx"
git commit -m "docs(examples): typed submit-to-backend example"
```

---

### Task 13: CLI scaffold uses `defineForm`

**Files:**
- Modify: whichever CLI source emits a starter config (grep `cli/src/*.mjs` for the config template string — likely `install.mjs` or `source.mjs`)
- Modify: matching `*.test.mjs`

**Step 1:** Add/adjust a test asserting the scaffolded config file content contains `defineForm(` and imports it from `form-builder`.

**Step 2:** Run the CLI test → FAIL. Update the template string. Re-run → PASS.

**Step 3: Commit**

```bash
git add cli/
git commit -m "feat(cli): scaffold config with defineForm"
```

---

## Phase 5 — Guardrails & wrap-up

### Task 14: `tsc` perf gate + full green

**Files:**
- Modify: `form-builder/core/inferValues.ts` (only if benchmark demands a depth cap)

**Step 1:** Run `npx tsc --noEmit --extendedDiagnostics` and record `Instantiations` / check time. If group recursion or the examples blow up type-instantiation count, cap `group` nesting depth in `NamedValues` (e.g. a depth counter tuple, max 5) and document the cap in the file header.

**Step 2:** Run the full gate:
```bash
yarn test && yarn lint && npx tsc --noEmit
```
Expected: all green.

**Step 3: Update AGENTS.md** — add `defineForm`/`InferValues` to the "Intentional decisions" or engine-layout notes so the type-inference seam isn't "simplified" away later, and note the `form-builder/next/` sub-path entry.

**Step 4: Commit**

```bash
git add form-builder/core/inferValues.ts AGENTS.md
git commit -m "chore(core): tsc perf gate + document type-inference seam"
```

---

## Deferred (explicitly out of scope)

- **Name-reference constraints** on `Condition.field`, `copyFrom`, `countryFrom`, `optionsFrom.field`, step `fieldNames`, `dependsOn`, `min/maxDateField` — a follow-up plan. `validateFormConfig` covers these at dev-time meanwhile. (Design open item #1: deferred.)
- **Codegen `.d.ts` path** (alternative B).
- **Ecosystem adapters** (tRPC, TanStack, next-safe-action), CMS runtime typing, AI/schema import.

## Definition of done

- `defineForm` + `InferValues` + `FieldNames` exported and type-tested (every design-table row pinned).
- `parseSubmission`, `FormRenderer`, `useDynamicForm`, `ServerErrorResult` generic and back-compatible (untyped callers unaffected).
- `createFormAction` typed wire shipped under `form-builder/next/`.
- Builder export, one docs pair, one example, CLI scaffold all emit `defineForm`.
- `yarn test && yarn lint && npx tsc --noEmit` green; `tsc` instantiation count within budget.
