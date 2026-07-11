# Condition arrays + validity conditions — design

Date: 2026-07-11. Status: approved (discussion phase, pre-implementation).

## Goal

Two features, one shape change:

1. Conditions on a field can be a **set** of conditions across multiple source fields, with AND and OR combination.
2. A condition can test another field's **validity** (its zod schema passing), not just its value — e.g. email field disabled until `firstName` and `lastName` are valid.

## Public shape

```ts
type Condition = {
  field: string;
  equals?: unknown;
  notEquals?: unknown;
  in?: unknown[];
  isValid?: boolean; // matches when source field validity === isValid
};

type ConditionSpec =
  | Condition                // back-compat: existing configs untouched
  | Condition[]              // AND — all must match
  | { anyOf: Condition[][] } // OR of AND-groups (DNF)
```

- `visibleWhen?: ConditionSpec` — value operators only (`isValid` rejected by validator).
- `disabledWhen?: ConditionSpec` — all operators including `isValid`.
- `enabledWhen?: ConditionSpec` — NEW; inverse of `disabledWhen` (field disabled while spec does NOT match). Exists to kill the De Morgan tax on the primary use case:

```ts
{ name: "email", type: "text", enabledWhen: [
  { field: "firstName", isValid: true },
  { field: "lastName",  isValid: true },
] }
```

A field may set `disabledWhen` or `enabledWhen`, not both (validator error).

### Why DNF, not a recursive tree

Any boolean combination is expressible as OR-of-ANDs. Flat two-level shape keeps the builder UI flat (Notion-filter style: rows AND within a group, groups OR together) and evaluation trivial (`groups.some(g => g.every(match))`). Recursive `allOf`/`anyOf`/`not` trees are power without a driving use case and force recursive builder UI.

### Leaf semantics

- Multiple operators on one leaf AND together (unchanged from today).
- `isValid: false` = "while invalid" — comes free from the `=== isValid` comparison.
- Empty arrays/groups are **rejected by the config schema**: the engine evaluates
  an empty spec as "matches" (defensive, same as absent), which for
  `disabledWhen` would silently mean permanently disabled — so `[]`,
  `{ anyOf: [] }` and `{ anyOf: [[]] }` never validate.

## Validity evaluation

Validity is computed by safe-parsing the source field's own zod schema against its current value — NOT read from RHF `formState.errors` (errors only exist after validation runs; safeParse has no mode/timing dependence). The machinery already exists: `FormRenderer` builds per-field schemas and exposes `isFieldValid(fieldName, value)` through `FieldRuntimeContext` (currently used by OTP `dependsOn` gating in `useOtpFlow`). Validity is a pure function of the watched value, so watching values gives reactivity for free.

## Why `isValid` is disabledWhen/enabledWhen-only

Visibility drives the schema: the condition-aware resolver validates only visible fields, and the submit payload strips hidden values. Validity-driven visibility therefore creates feedback loops (A visible when B valid, B visible when A valid) and makes payload stripping depend on other fields' validity. Disabled fields stay in the schema, so validity-driven disabling has no loop. Validator rejects `isValid` inside `visibleWhen`.

## Touch points

- `core/types.ts` — `Condition.isValid`, `ConditionSpec`, `enabledWhen` on BaseField.
- `core/conditions.ts` — normalize every spec to `Condition[][]` (single → `[[c]]`, array → `[arr]`, anyOf → as-is). `conditionMatches` stays pure per-leaf; `evaluateCondition` normalizes and takes an optional `isValid` callback (needed only for disabled/enabled specs). `getVisibleFields` signature unchanged — visibleWhen is value-only by validator guarantee.
- `components/FieldRuntime.tsx` (`FieldGate`) — collect all `field` names across a spec's groups; one `useWatch` name-array per spec (visible / disabled-or-enabled); build name→value record; evaluate. `isFieldValid` already on runtime context. `enabledWhen` = negated `disabledWhen` at this site.
- `fields/GroupField.tsx` — prefix every leaf across normalized groups (incl. `enabledWhen`).
- `core/schema.ts` — two leaf schemas: value-only (visibleWhen) and value+`isValid` (disabledWhen/enabledWhen), each in the `Condition | Condition[] | { anyOf }` union. New validator rules:
  - `isValid` in `visibleWhen` → error.
  - both `disabledWhen` and `enabledWhen` on one field → error.
  - `isValid` targeting a group-nested field → error (per-field schema map holds top-level fields only; precedent: group-nested otp wiring rejected).
  - `isValid` targeting `static`/`submit`/`hidden` or a custom field → error (their validity is constant — the condition would silently always or never match).
  - `isValid` source on a different wizard step → dev-warn (works — values persist under `shouldUnregister: false` — but usually a config smell; precedent: otp cross-step warn).
- `components/builder/controls/ConditionEditor.tsx` — biggest cost. Group-of-rows UI: rows AND within group, "+ OR group" adds a group. Existing single-condition configs load as one group / one row. `isValid` operator option only in the disabled/enabled editors.

## Out of scope

- Recursive condition trees (`not`, nested groups).
- `isValid` in `visibleWhen`.
- Conditions on fields inside groups (existing v1 limitation stands).
