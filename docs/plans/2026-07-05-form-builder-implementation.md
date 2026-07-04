# Dynamic Form Builder Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Config-driven, portable form-builder package (`form-builder/` folder) rendering validated dynamic forms from a `FormConfig` object.

**Architecture:** Registry pattern maps field `type` → component. RHF + zod own field state/validation (schema derived from config). Zustand store factory owns stepper index. CVA variants only in `ui/`. Single public export surface `form-builder/index.ts`. All strings arrive translated in config (i18n approach A); validation messages overridable via `messages` prop.

**Tech Stack:** Next.js 16.2.10 (App Router, Turbopack), React 19, TypeScript, Tailwind v4, shadcn/ui, react-hook-form, zod, @hookform/resolvers, zustand, CVA, input-otp, react-phone-number-input, react-day-picker, Vitest.

**Reference:** `docs/plans/2026-07-05-form-builder-design.md` — all design decisions. `form-builder-spec.md` — original spec.

**Rules for executor:**
- AGENTS.md: this Next.js version differs from training data. Docs at `node_modules/next/dist/docs/`. Verified already: `"use client"` composition unchanged, Turbopack default, Tailwind v4 via `@tailwindcss/postcss` already configured, no dynamic-segment routes needed.
- External lib APIs (input-otp, react-phone-number-input, react-day-picker, zod version, shadcn CLI): VERIFY against installed package docs/types before coding those tasks. Do not trust memory.
- TDD for `core/` and `hooks/`. Field components: no unit tests (design decision) — verify in demo page.
- Commit after every task. RTL: only logical Tailwind utilities (`ms-*`, `me-*`, `text-start`, `ps-*`, `pe-*`) in all new code. Dark mode: only shadcn token classes (`bg-background`, `text-muted-foreground`, …).

---

## Phase 0 — Prerequisites

### Task 0.1: Install dependencies

**Step 1:** Run:
```bash
yarn add react-hook-form zod @hookform/resolvers zustand class-variance-authority input-otp react-phone-number-input react-day-picker date-fns
yarn add -D vitest @vitejs/plugin-react jsdom @testing-library/react
```

**Step 2:** Verify: `yarn tsc --noEmit` passes; check installed zod major version (`node -e "console.log(require('zod/package.json').version)"`). If zod v4: `zodResolver` import comes from `@hookform/resolvers/zod` still — confirm in `node_modules/@hookform/resolvers/README.md`. Note version in commit message.

**Step 3:** Commit: `chore: add form-builder dependencies`

### Task 0.2: shadcn init + primitives

**Step 1:** Run `npx shadcn@latest init` (accept defaults; Tailwind v4 detected automatically; alias `@/*` already in tsconfig).

**Step 2:** Add primitives (this list is the portability contract — record it in README section of design doc if it drifts):
```bash
npx shadcn@latest add button input textarea label select command popover radio-group checkbox switch calendar slider progress separator form input-otp
```
Note: `form` component brings RHF-integrated `FormField/FormItem/FormLabel/FormControl/FormDescription/FormMessage` — fields build on these.

**Step 3:** Verify `components/ui/` populated, `yarn tsc --noEmit` passes, `yarn dev` renders default page clean.

**Step 4:** Commit: `chore: init shadcn with form-builder primitive set`

### Task 0.3: Vitest setup

**Files:** Create `vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: { environment: "jsdom", include: ["form-builder/**/*.test.{ts,tsx}"] },
  resolve: { alias: { "@": path.resolve(__dirname, ".") } },
});
```
Add script to package.json: `"test": "vitest run"`.

**Steps:** Create a throwaway `form-builder/core/smoke.test.ts` (`expect(1).toBe(1)`), run `yarn test` → PASS, delete smoke test, commit `chore: configure vitest`.

---

## Phase 1 — core/types.ts + core/schema.ts

### Task 1.1: types.ts

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

### Task 1.2: schema.ts (config self-validation, TDD)

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

---

## Phase 2 — core/registry.ts (TDD)

### Task 2.1

**Files:** `form-builder/core/registry.test.ts`, `form-builder/core/registry.ts`

**Step 1 — failing tests:** register component → `getField` returns it; unknown type → `undefined`; re-register overrides (custom project fields override built-ins); `getRegisteredTypes()` lists keys.

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

Commit: `feat: add field registry`.

---

## Phase 3 — ui/variants.ts + ui/FieldWrapper.tsx

### Task 3.1

**Files:** `form-builder/ui/variants.ts`, `form-builder/ui/FieldWrapper.tsx`

`variants.ts` — CVA only here:
```ts
import { cva } from "class-variance-authority";

export const fieldWrapperVariants = cva("flex flex-col gap-1.5", {
  variants: {
    size: { sm: "text-sm", md: "", lg: "text-lg" },
    state: { default: "", error: "[&_label]:text-destructive" },
  },
  defaultVariants: { size: "md", state: "default" },
});
```

`FieldWrapper.tsx` (`"use client"`): thin composition over shadcn `FormItem/FormLabel/FormDescription/FormMessage` (from `@/components/ui/form`). Props: `{ label?, description?, required?, size?, children }`. Required renders `<span aria-hidden className="text-destructive ms-1">*</span>`. All spacing logical (`ms-*`). No colors beyond tokens.

**Steps:** implement → `yarn tsc --noEmit` → commit `feat: add field wrapper and cva variants`.

---

## Phase 4 — Simple fields

Pattern for every field component: `"use client"`; receives `{ field }`; uses RHF context via shadcn `FormField` (`useFormContext` under the hood); renders inside `FieldWrapper`; honors `field.disabled` OR disabled-by-condition (passed via React context `FieldRuntimeContext { disabled: boolean }` provided by renderer's gate — created in Phase 7); never hardcodes styling beyond token classes.

### Task 4.1: TextField.tsx
Handles `text | email | password | textarea | number`. Password: local `showPassword` state + ghost Button toggle (`aria-label` from `field.label`). Number: `<Input type="number" min max step>`, value coerced via `onChange: e => onChange(e.target.valueAsNumber ?? undefined)`. Textarea: shadcn `Textarea`. Email: `type="email" inputMode="email"`.

### Task 4.2: CheckboxField.tsx
Three modes: boolean checkbox (shadcn `Checkbox`), `switch` (shadcn `Switch`), checkbox group when `options` present (value: `(string|number)[]`, toggle handler).

### Task 4.3: RadioField.tsx
shadcn `RadioGroup` + `RadioGroupItem` per option, option `disabled` honored.

### Task 4.4: HiddenField.tsx
Renders `null`. Value injected via defaults in `useDynamicForm` (Phase 6) — component exists only so registry resolves the type.

### Task 4.5: StaticField.tsx
No RHF wiring. `as` switch: `h1`→`<h1 className="text-3xl font-semibold">`, `h2`→`<h2 className="text-xl font-semibold">`, `p`→`<p className="text-muted-foreground">`, `divider`→shadcn `Separator`. Default `p`.

### Task 4.6: SubmitField.tsx
shadcn `Button type="submit" variant={field.variant}`; disabled while `formState.isSubmitting`; label = `field.text`.

**Each task:** implement → `yarn tsc --noEmit` → commit (`feat: add <X> field`). Registration deferred to `fields/index.ts` (Task 12.1) — but create the file now with running registrations as fields land, so demo works incrementally:

### Task 4.7: fields/index.ts (incremental)
```ts
import { registerField } from "../core/registry";
import { TextField } from "./TextField";
// ...
export function registerBuiltInFields(): void {
  registerField("text", TextField);
  registerField("email", TextField);
  registerField("password", TextField);
  registerField("textarea", TextField);
  registerField("number", TextField);
  registerField("checkbox", CheckboxField);
  registerField("switch", CheckboxField);
  // ... extend as fields land
}
```
Commit: `feat: register built-in fields`.

---

## Phase 5 — core/validation.ts + core/messages.ts (TDD)

### Task 5.1: messages.ts
```ts
export type Messages = {
  required: string;
  email: string;
  minLength: (n: number) => string;
  maxLength: (n: number) => string;
  min: (n: number) => string;
  max: (n: number) => string;
  pattern: string;
  fileSize: (mb: number) => string;
  otpLength: (n: number) => string;
};
export const defaultMessages: Messages = { /* plain English defaults */ };
```
`FormRenderer`/`useDynamicForm` accept `Partial<Messages>` and merge. This is the i18n hook (approach A).

### Task 5.2: validation.ts (TDD, biggest core module)

**Step 1 — failing tests** (`validation.test.ts`) — behavior matrix, one `describe` per type:
- text required → fails empty, passes "x"; optional → passes undefined
- text rules: minLength/maxLength/pattern (+ custom `message` surfaces)
- email format enforced; number min/max; otp exact length; slider min/max clamp
- select multiple → array schema; single → scalar
- checkbox group → array; boolean checkbox `required` → must be `true`
- date single → ISO string parse; range → `{ from, to }`; minDate/maxDate enforced
- phone → non-empty string when required (E.164 format check deferred to component lib)
- file → `z.instanceof(File)` (or array), maxSizeMB refine (skip in jsdom if File unavailable — use `new File([], ...)`)
- hidden → passthrough `z.unknown()`
- static/submit → EXCLUDED from schema (test: schema shape lacks those keys)
- group → `z.array(z.object(inner))`, min/max rows, inner field rules apply
- custom messages override defaults

**Step 3 — implement:** `toZodSchema(field, messages): ZodType | null` (null for static/submit), `buildFormSchema(config, messages): z.ZodObject`. Compose: skip null, group recurses. Optional fields wrapped `.optional()` — required flag decides.

**Steps 2/4/5:** run fail → implement → run pass → commit `feat: derive zod schema from field config`.

---

## Phase 6 — hooks/useDynamicForm.ts (TDD)

### Task 6.1

**Step 1 — failing tests** (`useDynamicForm.test.ts`, `renderHook` from @testing-library/react):
- defaults: text→`""`, checkbox→`false`, checkbox group/multi-select→`[]`, number/date→`undefined`, slider→`min`, hidden→`config.value`, group→`min` rows of inner defaults
- resolver wired: `trigger()` on empty required field → error with message from (possibly overridden) messages
- static/submit produce no default keys

**Step 3 — implement:**
```ts
"use client";
export function useDynamicForm(config: FormConfig, opts?: { messages?: Partial<Messages> }) {
  const messages = { ...defaultMessages, ...opts?.messages };
  const schema = useMemo(() => buildFormSchema(config, messages), [config]);
  const defaultValues = useMemo(() => buildDefaultValues(config), [config]);
  const form = useForm({ resolver: zodResolver(schema), defaultValues, shouldUnregister: true });
  return { form, schema, messages };
}
```
`shouldUnregister: true` = design decision: invisible fields drop out of values + validation. Dev-mode `validateFormConfig(config)` call here — single entry point.

Commit: `feat: add useDynamicForm hook`.

---

## Phase 7 — components/FormRenderer.tsx

### Task 7.1: FieldRuntimeContext + VisibilityGate

**Files:** `form-builder/components/FieldRuntime.tsx`

```tsx
"use client";
export const FieldRuntimeContext = createContext<{ disabled: boolean }>({ disabled: false });

export function FieldGate({ field, children }: { field: FieldConfig; children: ReactNode }) {
  const { control } = useFormContext();
  const visWatch = useWatch({ control, name: field.visibleWhen?.field ?? "", disabled: !field.visibleWhen });
  const disWatch = useWatch({ control, name: field.disabledWhen?.field ?? "", disabled: !field.disabledWhen });
  const visible = !field.visibleWhen || evaluateCondition(field.visibleWhen, { [field.visibleWhen.field]: visWatch });
  const disabled = !!field.disabled || (!!field.disabledWhen && evaluateCondition(field.disabledWhen, { [field.disabledWhen.field]: disWatch }));
  if (!visible) return null;
  return <FieldRuntimeContext.Provider value={{ disabled }}>{children}</FieldRuntimeContext.Provider>;
}
```
(Watches only the condition's source field — no full-form re-render. Verify `useWatch` `disabled` option exists in installed RHF version; if not, always watch and ignore.)

### Task 7.2: FormRenderer.tsx

```tsx
"use client";
type FormRendererProps = {
  config: FormConfig;
  onSubmit: (values: FormValues) => void | Promise<void>;
  messages?: Partial<Messages>;
  className?: string;
};
```
Body: `useDynamicForm` → shadcn `<Form {...form}>` → `<form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-4 gap-4">`. Per field: registry lookup (`getField(field.type)`), unknown → dev: `<div className="col-span-4 border border-destructive p-2 text-destructive">Unknown field type "X"</div>`, prod: `null`. colSpan map: `{1:"col-span-1",2:"col-span-2",3:"col-span-3",4:"col-span-4"}` (static strings — Tailwind can't see dynamic classes), default 4. Each field wrapped in `FieldGate`.

If `config.steps` present → delegate to `FormStepper` (Phase 11); until then ignore steps.

**Steps:** implement both → `yarn tsc --noEmit` → smoke-check in temp demo page (`app/demo/page.tsx` with 3-field config, submit logs values) → commit `feat: add FormRenderer walking config via registry`.

### Task 7.3: components/FormSection.tsx
Trivial presentational: title + description + children in `space-y-*`; used by demo and stepper. Commit with 7.2 if small.

---

## Phase 8 — core/conditions.ts (TDD)

(Ordering note: `FieldGate` in Phase 7 imports `evaluateCondition` — write conditions.ts FIRST if executing linearly; spec order kept but treat 8 → 7 as dependency. Executor: do Task 8.1 before Phase 7.)

### Task 8.1

**Step 1 — failing tests** (`conditions.test.ts`), operator matrix:
- `equals` match/mismatch; `notEquals`; `in` includes/excludes; missing field → compares `undefined`
- multiple operators present → AND semantics
- no operators → true (degenerate)
- dot-path field names (`team.0.role`) resolve into nested values

**Step 3 — implement:** pure `evaluateCondition(cond, values)` + tiny `getPath(obj, "a.0.b")` helper. No deps.

Commit: `feat: add declarative condition evaluation`.

---

## Phase 9 — Complex fields

For each: check the installed lib's README/types in `node_modules/<pkg>` FIRST (APIs drift). Implement → register in `fields/index.ts` → verify in demo page → commit per field.

### Task 9.1: SelectField.tsx
One component, three modes: plain (shadcn `Select`), searchable (`Command` inside `Popover`, chevron trigger `Button variant="outline"`), multiple (searchable UI + checkbox-style `CommandItem`s, value `(string|number)[]`, selected shown as count or badges). `placeholder` on trigger.

### Task 9.2: OtpField.tsx
shadcn `InputOTP` (input-otp lib): `maxLength={field.length}`, render `InputOTPGroup` with `field.length` slots. Value = string.

### Task 9.3: PhoneField.tsx
`react-phone-number-input`: use its headless `PhoneInput` with `inputComponent` set to shadcn `Input`; country select restyled with shadcn `Select` or lib default + token classes. `defaultCountry`, `countryOptionsOrder={preferredCountries}` (verify exact prop names in lib docs). Import lib CSS once or restyle fully — decide against lib CSS, style manually (dark mode + RTL safety).

### Task 9.4: DateField.tsx
`react-day-picker` via shadcn `Calendar` inside `Popover`; `mode={field.range ? "range" : "single"}`. Form value: single → ISO string (`date.toISOString()`), range → `{ from: string; to: string }` (keep JSON-serializable, matches validation schema from Task 5.2). `minDate`/`maxDate` → `disabled={{ before, after }}` matcher. Trigger Button shows formatted value (`date-fns format`) or placeholder.

### Task 9.5: SliderField.tsx
shadcn `Slider`: `min max step`, value `[n]` ↔ scalar in form. Current value displayed `text-muted-foreground`.

### Task 9.6: FileField.tsx
`<input type="file" className="sr-only">` + shadcn `Button` label trigger; `accept`, `multiple`. Client-side `maxSizeMB` check → RHF `setError` on violation. Selected files listed (name + size + remove). Value: `File | File[]`. Note in code: file values are NOT JSON-serializable — consumers handle upload in `onSubmit`.

---

## Phase 10 — GroupField (recursive)

### Task 10.1
`useFieldArray({ name: field.name })`. Renders per row: nested grid, recursion — inner fields rendered through same registry/`FieldGate` path with names prefixed `${field.name}.${index}.${inner.name}` (helper `withNamePrefix(field, prefix)` — write unit test for prefixing in `validation.test.ts` or small `group.test.ts`). Add-row Button (disabled at `max`), remove Button per row (disabled at `min`). Defaults for a new row come from `buildDefaultValues` of inner fields (export helper from Phase 6).

Commit: `feat: add recursive repeatable group field`.

---

## Phase 11 — Stepper

### Task 11.1: store/stepper.ts (TDD)
**Tests:** create store → step 0; `next()` increments to max steps-1; `prev()` floors at 0; `goTo(i)` clamps; `reset()`.
```ts
import { createStore } from "zustand/vanilla"; // verify import path in installed zustand
export function createStepperStore(stepCount: number) { /* { step, next, prev, goTo, reset } */ }
```
Factory per form instance (design decision — no global singleton). React binding via `useStore`.

### Task 11.2: components/FormStepper.tsx
Props: same as renderer internals — receives `config` (with `steps`), `form`, `messages`. Renders: step header (titles, current highlighted, `aria-current="step"`), only current step's fields (lookup by `fieldNames`), Prev/Next Buttons. Next: `await form.trigger(currentStepFieldNames)` → advance only if valid. Last step shows the config's `submit` field (or default submit button if none). Hidden fields always registered regardless of step. `FormRenderer` delegates here when `config.steps` present.

Commit: `feat: add multi-step form stepper with zustand`.

---

## Phase 12 — Public surface + kitchen-sink demo

### Task 12.1: index.ts
```ts
export type { FormConfig, FieldConfig, Condition, Option, TextRules, FormValues } from "./core/types";
export { registerField, getRegisteredTypes } from "./core/registry";
export { FormRenderer } from "./components/FormRenderer";
export { FormSection } from "./components/FormSection";
export { useDynamicForm } from "./hooks/useDynamicForm";
export { registerBuiltInFields } from "./fields";
export type { Messages } from "./core/messages";
```
Nothing else exported. Grep app code: no imports reaching into `form-builder/core|fields|components` directly except via root. Commit: `feat: finalize public export surface`.

### Task 12.2: Kitchen-sink demo
**Files:** `app/demo/page.tsx` (server — defines config object), `app/demo/DemoClient.tsx` (client — toggles + FormRenderer).

Config exercises: every field type, `visibleWhen` (select "other" → reveals text), `disabledWhen`, checkbox group, searchable + multiple select, date range, group (min 1 max 3), 3 steps, hidden UTM field, static heading/divider, custom pattern rule with custom message. DemoClient renders: RTL toggle (`<div dir=...>`), dark toggle (`document.documentElement.classList`), `onSubmit` → `<pre>{JSON.stringify(values, null, 2)}</pre>`.

**Verify (browser, `yarn dev`):** every field renders + validates; conditions toggle live; group add/remove; stepper blocks invalid step; RTL layout sane; dark mode clean; submit dumps correct values; invisible-field values absent from output.

Commit: `feat: add kitchen-sink demo page`.

### Task 12.3: Final pass
- `yarn test` all green; `yarn tsc --noEmit`; `yarn lint`; `yarn build` (Turbopack prod build must pass).
- Update design doc portability contract if shadcn add list changed.
- Commit: `chore: form-builder v1 complete`.

---

## Execution dependency graph

0.1→0.2→0.3 → 1.1→1.2 → 2.1 → 3.1 → (8.1) → 4.x → 5.1→5.2 → 6.1 → 7.x → 9.x → 10.1 → 11.x → 12.x
(8.1 conditions.ts must precede Phase 7 — FieldGate imports it.)
