# Review Fixes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. After each phase: run superpowers:code-reviewer sub-agent, apply fixes, commit, then next phase.

**Goal:** Resolve all actionable findings from the 2026-07-05 full package review (report delivered in-session).

**Architecture:** No layering changes. Fixes stay within existing config/logic/IO/presentation boundaries. Intentional decisions (shouldUnregister:false, resolver model, flat styling, isValid submit gating, shadcn devDep) untouched.

**Tech Stack:** unchanged (Next 16, React 19, RHF 7.80, zod 4.4, Tailwind v4, shadcn, vitest).

**Verification per phase:** `yarn tsc --noEmit` + `yarn vitest run` + `yarn eslint form-builder app --max-warnings=0` green, browser check where UI affected, code-reviewer sub-agent pass, commit.

---

## Phase 1 — Critical correctness

### Task 1.1: Date timezone fix (High)
**Files:** `form-builder/fields/DateField.tsx`, `form-builder/core/validation.ts`, `form-builder/core/validation.test.ts`
- Store calendar picks as local `yyyy-MM-dd` strings (date-fns `format(date, "yyyy-MM-dd")`), not `toISOString()`.
- Range mode: `{ from, to }` same format.
- `isoDateSchema`: validate via `Date.parse` still, but min/max compare as date-only strings (lexicographic compare valid for ISO dates). Reject non-`yyyy-MM-dd`-parsable input.
- `dayMatcher` + display parsing: construct local dates from parts (`new Date(y, m-1, d)`), never `new Date("yyyy-mm-dd")` (UTC parse).
- Tests: exact `minDate` day passes, day before fails, `maxDate` day passes, day after fails; range from/to boundaries.

### Task 1.2: OTP flow remount desync (High)
**Files:** `form-builder/hooks/useOtpFlow.ts`, `form-builder/components/FieldRuntime.tsx` (if needed)
- Initialize reducer status lazily: if `runtime.verifiedFields?.has(config.name)` → `verified`, else `idle`.
- `useReducer(reducer, undefined, init)` pattern with init reading verifiedFields at mount.
- Manual browser test: kitchen-sink `/demo` step 2 OTP — cannot fully verify there (no handlers) → test on demo-account by toggling a visibleWhen? Simplest: unit test in Phase 5 covers; browser sanity on demo-account normal flow unchanged.

### Task 1.3: Reject group-nested OTP wiring (Medium)
**Files:** `form-builder/core/schema.ts`, `form-builder/core/schema.test.ts`
- `validateFields`: when recursing into `group.fields`, reject `type: "otp"` fields carrying `dependsOn` or `enabledWhenVerified`, and any field with `enabledWhenVerified` inside a group. Clear error message citing runtime name prefixing.
- Tests: group with plain otp OK; group otp with dependsOn throws; group field with enabledWhenVerified throws.

**Phase gate:** checks green → code-reviewer → fixes → commit `fix: date boundaries, OTP remount state, group otp guards`.

---

## Phase 2 — Production hardening (config safety)

### Task 2.1: Config validation always on (High)
**Files:** `form-builder/core/schema.ts`, `form-builder/hooks/useDynamicForm.ts`
- Remove `NODE_ENV === "production"` early return. Validation runs once per config identity (already inside useMemo).
- Keep dev-only pieces (none currently env-dependent beyond the guard).

### Task 2.2: Guard RegExp construction (High)
**Files:** `form-builder/core/validation.ts`, `form-builder/fields/TextField.tsx`
- `applyTextRules`: wrap `new RegExp(rules.pattern)` in try/catch → on failure skip the rule (config validation already rejects invalid patterns; this is belt-and-braces for direct useDynamicForm callers).
- `TextField` `blockedChars` memo: try/catch → null on failure.

### Task 2.3: Pattern/allow hardening (High/Medium)
**Files:** `form-builder/core/schema.ts`, `form-builder/core/schema.test.ts`, `docs` note
- `pattern`: cap length (256 chars) + reject obviously nested quantifiers `(x+)+`-style via heuristic regex; document trusted-authors stance in spec/plan doc.
- `allow`: whitelist char-class body — allow only `A-Za-z0-9`, spaces, `\-`, `\s\d\w` escapes, ranges; reject `]`, `[`, unescaped `\` tricks.
- Field `name`: reject `.` (breaks getPath/RHF path semantics).
- Tests for each rejection.

### Task 2.4: defaultCountry dev validation (Low)
**Files:** `form-builder/core/schema.ts`
- Validate `defaultCountry`/`preferredCountries` against `libphonenumber-js` `getCountries()`.

**Phase gate:** checks → reviewer → commit `fix: production config safety`.

---

## Phase 3 — Accessibility

### Task 3.1: rhf.ref forwarding (Medium)
**Files:** `SelectField.tsx`, `DateField.tsx`, `PhoneField.tsx`, `RadioField.tsx`, `CheckboxField.tsx`, `SliderField.tsx`, `OtpField.tsx`, `FileField.tsx`
- Forward `ref={rhf.ref}` to first interactive element (trigger button / first radio / input) so RHF `shouldFocusError` works.

### Task 3.2: Stepper focus management (Medium)
**Files:** `form-builder/components/FormStepper.tsx`
- Step heading (`<ol>` current item or a step container heading) gets `tabIndex={-1}` + focus on step change.
- Failed `trigger` → focus first errored field via `form.setFocus(firstErrorName)`.

### Task 3.3: aria-describedby fixes (Low)
**Files:** `form-builder/fields/TextField.tsx`, `form-builder/fields/CheckboxField.tsx`, `form-builder/ui/FieldWrapper.tsx` (if id helper needs extension)
- Password checklist: give container `id={`${id}-rules`}`, include in `aria-describedby` when visible; compute describedby from same error the wrapper receives (no dangling `-error` ref).
- Checkbox group items: add `aria-describedby` like RadioField.

**Phase gate:** checks + browser keyboard pass on demo-account → reviewer → commit `fix: a11y focus and aria wiring`.

---

## Phase 4 — i18n, DX, quality

### Task 4.1: Locale passthroughs (Medium)
**Files:** `FormRenderer.tsx`, `FieldRuntime.tsx`, `DateField.tsx`, `PhoneField.tsx`
- `FormRenderer` prop `locale?: { dateFns?: Locale; countryLabels?: Record<string,string> }` → runtime context.
- DateField: pass `locale` to date-fns `format` + Calendar. PhoneField: `labels` passthrough.

### Task 4.2: Message catalog completeness (Low)
**Files:** `PhoneField.tsx`, `DateField.tsx`, `messages.ts`
- `CommandEmpty` uses `messages.noOptions`; date placeholder "…" → `config.placeholder ?? ""` or message; `otpDidntReceive` casing → "Didn't receive OTP?".

### Task 4.3: FileField single validation authority (Medium)
**Files:** `form-builder/fields/FileField.tsx`
- Drop `setError`/`clearErrors`; oversize file goes INTO RHF state, schema refine (`fileSchema` maxSizeMB) reports it via resolver.

### Task 4.4: Custom field `required` dev warning (Medium)
**Files:** `form-builder/core/schema.ts`
- Dev console.warn when custom (registered, non-built-in) field sets `required: true` — validation ignores it.

### Task 4.5: Dedup + exports (Low/Nit)
**Files:** `FormRenderer.tsx`, `FormStepper.tsx`, `SubmitField.tsx`, `index.ts`, `app/forms/*`
- Flat-grid class string → shared const (`ui/flatGrid.ts` or core constant).
- Stepper fallback submit reuses SubmitField-style gating via small shared component or renders a synthetic submit config through registry.
- Export `conditionMatches`/`evaluateCondition` from index.
- Demo name-rules shared const in `app/forms/` shared module.

**Phase gate:** checks + browser sanity → reviewer → commit `refactor: i18n hooks, file validation authority, dedup`.

---

## Phase 5 — Tests

### Task 5.1: useOtpFlow unit tests
**Files:** `form-builder/hooks/useOtpFlow.test.tsx` (new), devDep `@testing-library/react` if absent
- Mock `FieldRuntimeContext` + RHF wrapper. Fake timers.
- Cover: send success→sent+countdown; send fail idle vs resend return-state; auto-verify success→verified+registry trigger; verify fail→sent+error; attempted guard (same code no re-verify); dependency change→reset+invalidate called+generation orphans in-flight verify; verified init from verifiedFields (remount case); countdown tick; resend clears value.

### Task 5.2: FieldGate + renderField tests
- visibility/disabled composition, `enabledWhenVerified` gating via context set, unknown type dev block.

### Task 5.3: FormRenderer OTP registry integration
- verify→edit code→schema fails; invalidate on dependsOn change; onSendOtp receives current values.

### Task 5.4: Small core gaps
- `mergeMessages`, `getPasswordChecks`, `withTrim` parse output, `buildDefaultValues` custom defaultValue.

**Phase gate:** all green → reviewer → commit `test: interactive layer coverage`.

---

## Deferred (documented, not implemented)

- Task 5.3 slimmed: the schema-side registry contract is pinned in validation tests and the flow side in useOtpFlow tests with mocked IO; the remaining ~30 lines of FormRenderer glue (registry set/delete, Object.is dep snapshot, getValues into onSendOtp) rely on browser verification — jsdom + input-otp render tests were judged flaky-prone.

- Per-field schema caching / context splitting (perf — only needed >50 visible fields).
- Chained-visibility fixed-point evaluation (documented limitation, matches UI/resolver agreement).
- `defaultValues` prefill prop, `registerField` toSchema option (features, not fixes).
- Playwright automated E2E suite (manual browser verification continues per change).
- Select string/number Option value collision; `minRows` message; typed registerField helper; shadcn manifest doc (add to README when package extracted).
