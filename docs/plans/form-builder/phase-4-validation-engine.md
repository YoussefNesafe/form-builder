# Phase 4 — Validation & Conditions Engine

> Part of `docs/plans/2026-07-05-form-builder-implementation.md`. Read overview rules first. All TDD.

## Task 4.1: core/messages.ts
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
`FormRenderer`/`useDynamicForm` accept `Partial<Messages>` and merge. This is the i18n hook (approach A — see design doc).

Commit: `feat: add overridable validation messages`.

## Task 4.2: core/validation.ts (biggest core module)

**Files:** `form-builder/core/validation.test.ts`, `form-builder/core/validation.ts`

**Step 1 — failing tests** — behavior matrix, one `describe` per type:
- text required → fails empty, passes "x"; optional → passes undefined
- text rules: minLength/maxLength/pattern (+ custom `message` surfaces)
- email format enforced; number min/max; otp exact length; slider min/max clamp
- select multiple → array schema; single → scalar
- checkbox group → array; boolean checkbox `required` → must be `true`
- date single → ISO string parse; range → `{ from, to }`; minDate/maxDate enforced
- phone → non-empty string when required (E.164 format check deferred to component lib)
- file → `z.instanceof(File)` (or array), maxSizeMB refine (use `new File([], ...)` in jsdom)
- hidden → passthrough `z.unknown()`
- static/submit → EXCLUDED from schema (test: schema shape lacks those keys)
- group → `z.array(z.object(inner))`, min/max rows, inner field rules apply
- custom messages override defaults

**Step 2:** `yarn test` → FAIL.

**Step 3 — implement:** `toZodSchema(field, messages): ZodType | null` (null for static/submit), `buildFormSchema(config, messages): z.ZodObject`. Compose: skip null, group recurses. Optional fields wrapped `.optional()` — required flag decides.

**Step 4:** `yarn test` → PASS. **Step 5:** Commit `feat: derive zod schema from field config`.

## Task 4.3: core/conditions.ts

**Files:** `form-builder/core/conditions.test.ts`, `form-builder/core/conditions.ts`

**Step 1 — failing tests**, operator matrix:
- `equals` match/mismatch; `notEquals`; `in` includes/excludes; missing field → compares `undefined`
- multiple operators present → AND semantics
- no operators → true (degenerate)
- dot-path field names (`team.0.role`) resolve into nested values

**Step 2:** `yarn test` → FAIL.

**Step 3 — implement:** pure `evaluateCondition(cond, values)` + tiny `getPath(obj, "a.0.b")` helper. No deps.

**Step 4:** `yarn test` → PASS. **Step 5:** Commit: `feat: add declarative condition evaluation`.

(Placed before the renderer deliberately — `FieldGate` in Phase 5 imports `evaluateCondition`.)

## Task 4.4: hooks/useDynamicForm.ts

**Files:** `form-builder/hooks/useDynamicForm.test.ts`, `form-builder/hooks/useDynamicForm.ts`

**Step 1 — failing tests** (`renderHook` from @testing-library/react):
- defaults: text→`""`, checkbox→`false`, checkbox group/multi-select→`[]`, number/date→`undefined`, slider→`min`, hidden→`config.value`, group→`min` rows of inner defaults
- resolver wired: `trigger()` on empty required field → error with message from (possibly overridden) messages
- static/submit produce no default keys

**Step 2:** `yarn test` → FAIL.

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
`shouldUnregister: true` = design decision: invisible fields drop out of values + validation. Dev-mode `validateFormConfig(config)` call here — single entry point. Export `buildDefaultValues` (GroupField reuses it in Phase 6).

**Step 4:** `yarn test` → PASS. **Step 5:** Commit: `feat: add useDynamicForm hook`.
