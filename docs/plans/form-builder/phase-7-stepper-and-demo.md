# Phase 7 — Stepper, Public Surface, Kitchen-Sink Demo

> Part of `docs/plans/2026-07-05-form-builder-implementation.md`. Read overview rules first.

## Task 7.1: store/stepper.ts (TDD)

**Files:** `form-builder/store/stepper.test.ts`, `form-builder/store/stepper.ts`

**Step 1 — failing tests:** create store → step 0; `next()` increments to max steps-1; `prev()` floors at 0; `goTo(i)` clamps; `reset()`.

**Step 3 — implement:**
```ts
import { createStore } from "zustand/vanilla"; // verify import path in installed zustand
export function createStepperStore(stepCount: number) { /* { step, next, prev, goTo, reset } */ }
```
Factory per form instance (design decision — no global singleton). React binding via `useStore`.

**Steps 2/4/5:** fail → implement → pass → commit `feat: add stepper store factory`.

## Task 7.2: components/FormStepper.tsx
Receives `config` (with `steps`), `form`, `messages`. Renders: step header (titles, current highlighted, `aria-current="step"`), only current step's fields (lookup by `fieldNames`), Prev/Next Buttons. Next: `await form.trigger(currentStepFieldNames)` → advance only if valid. Phase 4 finding: NEVER gate on `formState.isValid` — the condition-aware resolver computes it across ALL visible fields on every step; only the `trigger()` return value is step-scoped. Last step shows config's `submit` field (or default submit button if none). Hidden fields always registered regardless of step. `FormRenderer` delegates here when `config.steps` present (wire the delegation left open in Task 5.2).

Commit: `feat: add multi-step form stepper with zustand`.

Phase 6 review follow-up (do with 7.3): move remaining hardcoded UI strings into `Messages` — PhoneField `aria-label="Country"`, GroupField `Remove row ${n}`/add-button fallback, FileField `Remove ${name}`, SelectField `CommandEmpty` placeholder.

## Task 7.3: index.ts (public surface)
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

## Task 7.4: Kitchen-sink demo
**Files:** `app/demo/page.tsx` (server — defines config object), `app/demo/DemoClient.tsx` (client — toggles + FormRenderer).

Config exercises: every field type, `visibleWhen` (select "other" → reveals text), `disabledWhen`, checkbox group, searchable + multiple select, date range, group (min 1 max 3), 3 steps, hidden UTM field, static heading/divider, custom pattern rule with custom message. DemoClient renders: RTL toggle (`<div dir=...>`), dark toggle (`document.documentElement.classList`), `onSubmit` → `<pre>{JSON.stringify(values, null, 2)}</pre>`.

**Verify (browser, `yarn dev`):** every field renders + validates; conditions toggle live; group add/remove; stepper blocks invalid step; RTL layout sane; dark mode clean; submit dumps correct values; invisible-field values absent from output.

Commit: `feat: add kitchen-sink demo page`.

## Task 7.5: Final pass
- `yarn test` all green; `yarn tsc --noEmit`; `yarn lint`; `yarn build` (Turbopack prod build must pass).
- Update design doc portability contract if shadcn add list changed.
- Commit: `chore: form-builder v1 complete`.
