# Dynamic Form Builder — Design

Date: 2026-07-05
Status: Approved
Spec: `form-builder-spec.md` (repo root)

## Decisions (from clarification)

| Decision | Choice |
|---|---|
| Packaging | Root-level `form-builder/` folder inside this Next.js app; app doubles as dev playground. Portability = copy folder. |
| Scope | Full spec, phased per spec's implementation order (1–12). |
| Submit API | `onSubmit(values)` prop on `FormRenderer`. Transport-agnostic. |
| Testing | Vitest for `core/` + `useDynamicForm`. Field components verified via demo page. |
| Demo | Kitchen-sink page: every field type, conditions, group, stepper, RTL toggle, dark mode toggle. |
| Zustand | Stepper only (per-instance store factory). Cross-form shared state deferred. |
| i18n | Approach A: translated-config. Package i18n-agnostic; consumer passes translated strings. Validation messages overridable via `messages` prop. |
| RTL | Tailwind logical properties only (`ms-`/`me-`/`text-start`); `dir` inherited from document. |
| Dark mode | shadcn CSS variables; custom components use token classes only. |
| SSR | Config is JSON-serializable; server pages pass config across RSC boundary to client `FormRenderer`. |

### i18n approaches considered

- **A — Translated-config (chosen):** all user-facing strings arrive already translated in config. Zero i18n dependency, max portability. Consumer rebuilds config per locale (config is data — cheap).
- **B — t-function injection:** config stores keys, renderer takes `t(key)`. Rejected: forces key discipline, config not self-contained.
- **C — next-intl integration:** rejected: hard Next-specific dependency kills portability requirement.

## Spec gap resolutions

1. `switch` in type union but not field table → boolean like checkbox, rendered as shadcn `Switch`; single `CheckboxField.tsx` handles `checkbox | switch` and checkbox-group (via `options?: Option[]`).
2. `TextRules` undefined in spec → `{ minLength?: number; maxLength?: number; pattern?: string; message?: string }`. Pattern is string (not RegExp) to keep config JSON-serializable.
3. `hidden`/`static`/`submit` inherit irrelevant BaseField props → union kept as spec'd; irrelevant props ignored at render; config schema warns in dev.
4. Group naming → RHF `useFieldArray`; values nest as `groupName[i].fieldName`; conditions inside a group scope to their own row.
5. Disabled fields (`disabledWhen` true) keep value and stay validated — standard HTML semantics.
6. ~~Invisible fields (`visibleWhen` false) are unregistered from RHF (`shouldUnregister`)~~ **Revised during Phase 4:** `shouldUnregister: true` also drops hidden-field defaults and wizard-step values on unmount. Instead: `shouldUnregister` stays false (values persist across steps/conditions); a condition-aware resolver validates only currently visible fields; the submit payload is the resolver's zod-parsed strip-mode output, so condition-hidden values never reach `onSubmit` (verified against RHF 7.80 — `stripInvisibleValues` exists only for headless `getValues()` consumers). Limitation (v1): conditions on fields *inside* groups are not skipped by validation.

## Package layout

```
form-builder/                  # root-level folder, copy-paste portable
  core/
    types.ts                   # FieldConfig union, FormConfig, Condition, TextRules, Option
    schema.ts                  # zod schema validating FormConfig itself (dev-time)
    registry.ts                # Map<string, FieldComponent>, registerField(), getField()
    validation.ts              # toZodSchema(field) per type → composed form schema
    conditions.ts              # evaluate(condition, values) for visibleWhen/disabledWhen
    messages.ts                # default validation messages + consumer override map
  fields/                      # 13 components per spec, all "use client"
    TextField.tsx              # text, email, password, textarea, number
    OtpField.tsx               # input-otp
    PhoneField.tsx             # react-phone-number-input wrapped in shadcn styling
    SelectField.tsx            # Select or Command+Popover via `searchable`; `multiple`
    RadioField.tsx
    CheckboxField.tsx          # checkbox, switch, checkbox group
    DateField.tsx              # single + range, react-day-picker + Popover
    SliderField.tsx
    FileField.tsx              # input[type=file] + Button/Progress, accept/maxSizeMB/multiple
    HiddenField.tsx
    StaticField.tsx            # h1/h2/p/divider
    GroupField.tsx             # recursive repeatable via useFieldArray
    SubmitField.tsx
    index.ts                   # imports + registers all
  ui/
    FieldWrapper.tsx           # label/description/error shell, RTL-safe logical props
    variants.ts                # CVA: size, state, layout
  components/
    FormRenderer.tsx           # walks fields[], registry lookup, 4-col grid + colSpan
    FormSection.tsx
    FormStepper.tsx            # FormConfig.steps + Zustand step store
  hooks/
    useDynamicForm.ts          # RHF + zodResolver + defaults from config
  store/
    stepper.ts                 # createStepperStore() factory, per form instance
  index.ts                     # ONLY public exports
```

Boundaries:
- App imports only from `form-builder` root index.
- shadcn primitives live in app-level `components/ui/`; `form-builder/` imports via alias.
- **Portability contract:** consuming project must run the same `shadcn add` list (shadcn is copy-in code). Documented, not vendored — vendoring was considered and rejected (duplicates components.json flow, diverges from app theme).
  Actual list (shadcn 4.13, radix base): `button input textarea label select command popover radio-group checkbox switch calendar slider progress separator input-otp @shadcn/field` (+ `dialog`, `input-group` pulled in as dependencies). Note: the RHF-bound `form` component was removed from the registry — `field` primitives replace it; RHF wiring is done via `Controller` in `form-builder/` code.
  The `shadcn` package must stay a devDependency: `app/globals.css` imports `"shadcn/tailwind.css"` at build time (prod build fails without it).
- **Custom field contract (v1):** consumers register via `registerField(type, Component)`. Custom configs type as `CustomFieldConfig` (BaseField + arbitrary props), validate against the BaseField contract only, and pass through value validation as `z.unknown()` — the custom component owns richer validation. Default value comes from an optional `defaultValue` config prop. `FieldWrapper`, `useFieldRuntime`, and `useFieldDisabled` are exported so custom fields match built-in chrome, disabled composition, and localized strings.
- Zustand stepper store is a factory per form instance — no global singleton, no cross-form collisions, extendable later.

## Core types

Spec types verbatim, plus:

```ts
type Option = { label: string; value: string | number; disabled?: boolean };

type TextRules = {
  minLength?: number;
  maxLength?: number;
  pattern?: string;   // string, not RegExp — JSON-serializable
  message?: string;   // custom error for pattern
};
```

- `FormRenderer` accepts optional `messages` prop overriding default validation messages (`required`, `email`, `minLength`, …) — the approach-A i18n hook.
- `core/schema.ts` validates config shape at runtime in dev only (`NODE_ENV !== "production"`), throws readable error naming the bad field. Production skips.
- All config JSON-serializable (patterns as strings, dates as ISO strings) → crosses RSC boundary.

## Validation & conditions engine

- `toZodSchema(field)`: per-type zod builder. `required` → `.min(1)`/`nonempty`/`refine` per type; optional fields `.optional()`. Group → `z.array(z.object(inner)).min(min).max(max)`. Hidden → `z.unknown()`. Static/submit excluded.
- Composed once per config into `z.object({...})`, memoized in `useDynamicForm`.
- Invisible fields: unregistered from RHF → excluded from values and validation (see gap resolution 6).
- `conditions.ts`: pure `evaluate(condition, values)`; `equals`/`notEquals`/`in`; missing field compares against `undefined`.
- `FormRenderer` subscribes per-condition via `useWatch` on `condition.field` only — no full-form re-renders.

## Rendering pipeline

- `useDynamicForm(config)`: builds defaultValues (from config + `hidden.value`), zod schema, returns RHF `form` + helpers. Usable headless without `FormRenderer`.
- `FormRenderer({ config, onSubmit, messages?, className? })`: 4-col CSS grid, `colSpan` → `col-span-*`. Per field: registry lookup → visibility gate (evaluates `visibleWhen`) → `FieldWrapper` → field component. Unknown type → dev-mode error block, prod skip.
- `FieldWrapper`: label + required asterisk, description, error slot with `aria-describedby`/`aria-invalid`, CVA size/state variants.
- `FormStepper`: renders current step's fields (by `fieldNames`), next/prev with per-step validation via `trigger(stepFieldNames)`, Zustand for index, submit only on last step.
- SSR: server page defines config → client `FormRenderer`. No `Date.now`/random in render paths.

## Testing

Vitest + jsdom; @testing-library/react only for `renderHook`:
- `validation.ts`: each field type → schema behavior matrix.
- `conditions.ts`: operator matrix incl. missing-field cases.
- `registry.ts`: register/get/override/unknown.
- `schema.ts`: bad config rejection with readable errors.
- `useDynamicForm`: defaults derivation, resolver wiring.

Field components: manual verification via kitchen-sink demo (browser).

## Demo

`app/demo/page.tsx`: every field type, conditional visibility demo (select toggles fields), group add/remove, 3-step wizard, RTL toggle (`dir` switch), dark mode toggle, submitted values dumped to `<pre>`.

## Implementation order

Spec order 1–12, tests written alongside each core phase (TDD for core modules):

1. `core/types.ts` + `core/schema.ts`
2. `core/registry.ts`
3. `ui/FieldWrapper.tsx` + `ui/variants.ts`
4. Simple fields: Text, Checkbox, Radio, Hidden, Static, Submit
5. `core/validation.ts`
6. `hooks/useDynamicForm.ts`
7. `components/FormRenderer.tsx`
8. `core/conditions.ts`
9. Complex fields: Select, Phone, Otp, Date, Slider, File
10. `GroupField`
11. `components/FormStepper.tsx` + `store/stepper.ts`
12. `index.ts` public surface + kitchen-sink demo

Prerequisites before phase 1: shadcn init + required primitives, deps (`react-hook-form`, `zod`, `@hookform/resolvers`, `zustand`, `class-variance-authority`, `input-otp`, `react-phone-number-input`, `react-day-picker`), Vitest setup. Note `AGENTS.md`: read `node_modules/next/dist/docs/` before writing code — Next.js version has breaking changes.
