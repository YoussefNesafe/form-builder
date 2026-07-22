# Type-Safe Config Spine — Design

**Date:** 2026-07-23
**Status:** Design approved, ready for implementation planning
**Scope:** DX / type-safety + submit→backend integration + adoption tooling. No new field types.

## Problem

The engine is runtime-complete but the type layer dead-ends at `FormValues = Record<string, unknown>`. A developer hand-authoring a `FormConfig` gets:

- No autocomplete or inferred types on the submit payload.
- No compile-time safety on field-name references (`Condition.field`, `copyFrom`, `countryFrom`, `optionsFrom.field`, step `fieldNames`, `dependsOn`, `min/maxDateField` are all bare `string`).
- No typed handoff from client submit → server validation → field errors back.

Brainstorming narrowed the target (three rounds):
1. Dimensions that matter: **DX & type-safety, adoption & tooling, integrations** (dropped "new form capabilities" — field set already rich).
2. Author path: **hand-written TS config + visual-builder export** (CMS/runtime-JSON deprioritized).
3. Integration glue: **submit → backend** end-to-end typed wire (dropped ecosystem adapters, data-mapping, AI import).

All three converge on one seam: **make the config the single source of truth for value types.** Fix that and every selected dimension lights up.

## Approach

Chosen: **type-level inference + thin `defineForm()` identity helper (A)**. Codegen (B) deferred as an optional later accelerator for the builder-export path (reuses existing `registry:generate` infra). Fluent builder API (C) rejected — it kills plain-object config and would break the visual-builder serializer and CMS path (product DNA).

Rationale: zero runtime cost, preserves the plain-object `FormConfig` that is the product's identity, no build step, best for the hand-edit iteration loop, fully back-compatible.

## Section 1 — Inference core

Two new files, zero runtime weight.

`form-builder/core/defineForm.ts` — identity helper:

```ts
export const defineForm = <const C extends FormConfig>(c: C): C => c;
```

The `const` type param captures literal `name`/`type`/`options` without the author writing `as const`. Runtime returns the argument untouched. The builder serializer wraps its output in `defineForm(...)` (one-line change).

`form-builder/core/inferValues.ts` — **types only**, no runtime. `InferValues<C>` walks `C["fields"]`, mapping each field by `type` → value type, keyed by `name`:

| field type | value type |
|---|---|
| text / email / textarea / password / masked / otp / phone / country / radio / segmented / signature | `string` |
| number / slider / rating | `number` |
| checkbox / switch (no options) | `boolean` |
| checkbox / switch / select `multiple` | `string[]` |
| select single | `string` |
| date (single) / time | `string` |
| date `range` | `[string, string]` |
| file | `File \| File[]` |
| group | `Array<InferValues<fields>>` |
| hidden | value type |
| static / submit | omitted from payload |
| custom `type` (registered) | `unknown` |

Two baked-in nuances:

1. **Visibility → optional.** Fields with `visibleWhen` / `enabledWhenVerified` can be stripped by `parseSubmission`, so they are `?`-optional in the inferred payload. Non-conditional required fields are non-optional.
2. **Total back-compat.** `FormValues = Record<string, unknown>` stays as the loose fallback. `FormRenderer<C>`, `useDynamicForm<C>`, `parseSubmission<C>` take an **optional** generic defaulting to the loose type. Untyped callers are unaffected. Zero breaking change.

**Field-name reference safety** (constraining references to the real `FieldNames<C>` union) is the fiddliest part. Phased as a sub-step: ship value inference first (high value, lower risk), then name-reference constraints. Runtime `validateFormConfig` already catches bad names at dev-time as the safety net during the gap.

## Section 2 — Public API surface

Generics thread through the existing barrel, all optional, all defaulted → no break.

```ts
export const defineForm: <const C extends FormConfig>(c: C) => C;
export type InferValues<C extends FormConfig>;
export type FieldNames<C extends FormConfig>;   // string union of field names

FormRenderer<C extends FormConfig = FormConfig>(props: {
  config: C;
  onSubmit: (values: InferValues<C>) => void | Promise<void>;   // was FormValues
  ...
})
useDynamicForm<C>(config: C): { ...; values: InferValues<C> }
parseSubmission<C>(config: C, body, opts): ParseSubmissionResult<InferValues<C>>
applyServerErrors<C>(...)   // error keys constrained to FieldNames<C>
```

Consumer diff = wrap the config in `defineForm(...)`. Nothing else. Barrel adds 3 exports.

## Section 3 — Submit→backend wire

No new runtime engine — a typed recipe plus one thin helper, built on existing `parseSubmission`, `applyServerErrors`, `ServerErrorResult`.

```
client                          server (action / route handler)
─────                           ─────────────────────────────
defineForm(cfg)                 parseSubmission(cfg, body, opts)
  → InferValues<cfg>              → { ok:true, data: InferValues<cfg> }
FormRenderer onSubmit(values)     | { ok:false, errors }   // keys ∈ FieldNames<cfg>
  → POST / server action        ─────────────────────────────
  ← ServerErrorResult           applyServerErrors → RHF setError
```

Deliverables:
- Optional helper `createFormAction(cfg, handler)` — wraps a Next server action: parses with `parseSubmission`, hands `handler` the typed `data`, funnels field errors into `ServerErrorResult`. ~30 lines, opt-in. Non-Next users call `parseSubmission` directly.
- Doc recipe for both server-action and route-handler styles.

Out of scope (future): tRPC / TanStack / next-safe-action adapters, CMS runtime path, AI schema-import.

## Section 4 — Adoption & tooling

Ride existing surfaces; build no new ones.

- **Docs:** `/docs/type-safety` (authoring with `defineForm`, what infers, the conditional-optional rule) + `/docs/submit-to-backend` (the Section-3 wire). Follow `DocsProse` pattern.
- **Example:** one new route under `app/(site)/examples/` — typed form + server action, red-squiggle on wrong field name, typed payload. Reuses `ExamplePageShell`.
- **Builder export:** serializer wraps output in `defineForm(...)` and emits the `InferValues` alias, so "Export code" hands the developer a typed config for free — serves the builder-export author path directly.
- **CLI:** scaffolded config uses `defineForm`. No new command.
- **fieldTypes single-source rule** (AGENTS.md) respected — no copy duplication.

## Section 5 — Testing & migration

- **Type-level tests:** `inferValues.test-d.ts` (`expectTypeOf`) pinning every table row + the conditional-optional rule + `FieldNames` union. Primary regression guard.
- **Runtime tests:** `defineForm` identity; `createFormAction` parse+error funnel; builder serializer emits valid `defineForm(...)` that round-trips through `validateFormConfig`.
- **Migration:** zero forced. Opt in per-form by wrapping in `defineForm`. Additive.
- **Perf:** deep conditional types can slow `tsc`. Cap group recursion depth, benchmark `tsc --extendedDiagnostics` on examples, keep `InferValues` table-driven (non-recursive where a lookup suffices).

## Section 6 — Risks & open decisions

| Risk | Mitigation |
|---|---|
| Conditional-type complexity → unreadable errors | Flat, table-driven mappers; ship value inference before name-reference constraints |
| `tsc` slowdown on large configs | Depth cap + benchmark gate in tests |
| Custom registered fields unknowable | Map to `unknown`; document augmentation escape hatch |
| Name-reference safety is hard | Phased; `validateFormConfig` runtime net covers the gap |
| Builder / CMS / JSON paths must keep working | `defineForm` is pure identity; plain-object config untouched |

**Open decisions for the plan:**
1. Ship name-reference constraints in the same effort, or defer to a follow-up?
2. `createFormAction` in the core barrel, or a separate `/next` entry to keep core framework-agnostic?

## Non-goals

New field types; fluent/chained authoring API; CMS runtime typing; AI/schema import; ecosystem adapters (tRPC, TanStack, next-safe-action).
