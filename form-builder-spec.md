# Dynamic Form Builder — Project Spec

## Goal

Build a config-driven, portable form builder package. Developers write a `FormConfig` (JSON/TS object) and the package renders a fully working, validated, dynamic form. No visual/drag-drop builder — this is a renderer engine only. Must be dropped into multiple projects with minimal friction.

## Stack

- Next.js
- shadcn/ui
- Tailwind CSS
- Zustand (orchestration state only — wizard steps, cross-form state)
- CVA (variants for UI wrapper components)
- react-hook-form + zod (field-level state and validation — assumed by shadcn's form primitives)

## Architectural Principles

1. **UI and logic are fully separated.** Field components only render; validation, conditions, and state derivation live in `core/`.
2. **Config is the single source of truth.** Validation schemas, default values, and rendering all derive from the same `FieldConfig` objects — never hand-duplicated.
3. **Field registry, not switch statements.** `registerField(type, Component)` lets any consuming project register custom field types without touching core files.
4. **RHF owns field state. Zustand owns orchestration** (multi-step index, shared state across pages/forms). Never duplicate the same state in both.
5. **Conditional logic is declarative data** (`visibleWhen`, `disabledWhen`), evaluated against RHF's `watch()` — not imperative code per form.
6. **CVA variants live only in `ui/` wrapper components.** Field components never hardcode styling.
7. **Single public import surface.** Consumers only ever import from the package's root `index.ts`. Nothing outside reaches into `core/` or `fields/` directly. This is what makes it portable across projects.

## Folder Structure

```
form-builder/
  core/
    types.ts        // FieldConfig union, FormConfig, Condition
    schema.ts        // zod schema validating the config itself
    registry.ts       // fieldType -> component map, registerField()
    validation.ts      // builds zod schema FROM config (toZodSchema per field)
    conditions.ts        // evaluates visibleWhen / disabledWhen against form values
  fields/
    TextField.tsx        // text, email, password, textarea, number
    OtpField.tsx
    PhoneField.tsx
    SelectField.tsx        // handles searchable + non-searchable via `searchable` flag
    RadioField.tsx
    CheckboxField.tsx
    DateField.tsx           // single date + date range
    SliderField.tsx
    FileField.tsx
    HiddenField.tsx
    StaticField.tsx          // heading/divider/paragraph, not a real input
    GroupField.tsx             // repeatable field group (recursive)
    SubmitField.tsx
    index.ts                     // imports + registers all of the above
  ui/
    FieldWrapper.tsx    // label, description, error — shadcn based
    variants.ts           // cva variants: size, state, layout
  components/
    FormRenderer.tsx     // walks config, resolves registry, renders fields
    FormSection.tsx
    FormStepper.tsx        // optional multi-step wrapper
  hooks/
    useDynamicForm.ts    // wires react-hook-form + zod schema + config together
  index.ts                 // public exports ONLY (this is the package's public API)
```

## Field Types (Full List)

| Type       | Notes / Library                                                                                                                                   |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `text`     | plain text input                                                                                                                                  |
| `email`    | text input, email keyboard + validation                                                                                                           |
| `password` | text input with show/hide toggle                                                                                                                  |
| `textarea` | multiline                                                                                                                                         |
| `number`   | min/max/step, numeric keyboard                                                                                                                    |
| `otp`      | shadcn `input-otp`, configurable `length` (e.g. 6)                                                                                                |
| `phone`    | `react-phone-number-input`, wrapped to match shadcn styling, country flag dropdown                                                                |
| `select`   | shadcn `Select` (no search) or `Command` + `Popover` combobox (search) — one component, toggled by `searchable` boolean; also supports `multiple` |
| `radio`    | radio group, exclusive short choices                                                                                                              |
| `checkbox` | boolean or checkbox group                                                                                                                         |
| `date`     | single date or range, `react-day-picker` + `Popover`                                                                                              |
| `slider`   | shadcn native `Slider`                                                                                                                            |
| `file`     | custom-built on `<input type="file">` + shadcn `Button`/`Progress`, `accept`, `maxSizeMB`, `multiple`                                             |
| `hidden`   | not rendered; rides along with form values (tokens, IDs, UTM params)                                                                              |
| `static`   | heading/paragraph/divider block, not a real field, no value                                                                                       |
| `group`    | recursive — wraps a repeatable sub-array of `FieldConfig[]` (e.g. "add another team member"), with `min`/`max`                                    |
| `submit`   | submit button, `text` + `variant`                                                                                                                 |

Deferred until a real project needs them: masked input (treat as `text` + `mask` prop), autocomplete free-text, toggle group, rating, signature pad, rich text, color picker, address autocomplete, captcha.

## Type Definition (core/types.ts)

```ts
type Condition = {
  field: string;
  equals?: unknown;
  notEquals?: unknown;
  in?: unknown[];
};

type FieldWidth = "full" | "half" | "third" | "quarter";
type ResponsiveFieldWidth =
  | FieldWidth
  | { mobile?: FieldWidth; tablet?: FieldWidth; desktop?: FieldWidth };

type BaseField = {
  name: string;
  label?: string;
  description?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  visibleWhen?: Condition;
  disabledWhen?: Condition;
  // A FieldWidth value, or per-breakpoint { mobile?, tablet?, desktop? }.
  // Default full; unset breakpoints fall back to full.
  width?: ResponsiveFieldWidth;
};

type FieldConfig =
  | (BaseField & {
      type: "text" | "email" | "password" | "textarea";
      rules?: TextRules;
    })
  | (BaseField & { type: "number"; min?: number; max?: number; step?: number })
  | (BaseField & { type: "otp"; length: number })
  | (BaseField & {
      type: "phone";
      defaultCountry?: string;
      preferredCountries?: string[];
    })
  | (BaseField & {
      type: "select";
      options: Option[];
      searchable?: boolean;
      multiple?: boolean;
    })
  | (BaseField & { type: "radio"; options: Option[] })
  | (BaseField & { type: "checkbox" | "switch" })
  | (BaseField & {
      type: "date";
      range?: boolean;
      minDate?: string;
      maxDate?: string;
    })
  | (BaseField & { type: "slider"; min: number; max: number; step?: number })
  | (BaseField & {
      type: "file";
      accept?: string;
      maxSizeMB?: number;
      multiple?: boolean;
    })
  | (BaseField & { type: "hidden"; value: unknown })
  | (BaseField & {
      type: "static";
      content: string;
      as?: "h1" | "h2" | "p" | "divider";
    })
  | (BaseField & {
      type: "group";
      fields: FieldConfig[];
      min?: number;
      max?: number;
    })
  | (BaseField & { type: "submit"; text: string; variant?: ButtonVariant });

type FormConfig = {
  id: string;
  title?: string;
  description?: string;
  fields: FieldConfig[];
  steps?: { title: string; fieldNames: string[] }[]; // optional multi-step grouping
};
```

## Implementation Order (suggested for Claude Code)

1. `core/types.ts` + `core/schema.ts` — lock the type system first, everything else depends on it.
2. `core/registry.ts` — registry pattern with `registerField`/`getField`.
3. `ui/FieldWrapper.tsx` + `ui/variants.ts` — shared label/error/description shell.
4. Simple fields first: `TextField`, `CheckboxField`, `RadioField`, `HiddenField`, `StaticField`, `SubmitField`.
5. `core/validation.ts` — `toZodSchema(field)` per field type, composed into one form schema.
6. `hooks/useDynamicForm.ts` — wires RHF + zod schema + defaultValues from config.
7. `components/FormRenderer.tsx` — walks `fields[]`, resolves via registry, renders.
8. `core/conditions.ts` — `visibleWhen`/`disabledWhen` evaluation against `watch()`.
9. Complex fields: `SelectField` (searchable/non-searchable), `PhoneField`, `OtpField`, `DateField`, `SliderField`, `FileField`.
10. `GroupField` — recursive repeatable field group, last since it depends on everything above working.
11. `components/FormStepper.tsx` — optional multi-step wrapper using `FormConfig.steps` + Zustand for step index.
12. `index.ts` — finalize public export surface only.

## UI Foundation Decision

Build on shadcn/ui primitives — do NOT build UI components from scratch. shadcn is copy-in code (not a locked npm dependency), so full customization remains possible. Only build custom where no shadcn primitive exists (advanced file upload with progress/drag-drop) or wrap external libraries in shadcn styling (`react-phone-number-input` for phone, `input-otp` for OTP).

Existing libraries (RJSF, JSON Forms, SurveyJS, coltorapps/builder) were evaluated and rejected: none are shadcn-first with this exact field set, and re-theming them costs more than building the thin registry/renderer layer described here.

## Portability Requirement

This package must be copy-pasteable or npm-linkable into other Next.js projects with zero project-specific code inside `core/` or `fields/`. Any project-specific field types get registered from the consuming project via `registerField()`, not by editing this package.

## Config Trust Model

Configs are treated as **trusted-author content** (developers or vetted CMS editors), not end-user input. `validateFormConfig` runs in production too and rejects the common footguns — invalid/oversized `rules.pattern`, nested-quantifier ReDoS shapes like `(a+)+` (heuristic: bounded-repetition masks such as `(\d{4}[- ]?){3}\d{4}` are also rejected; rewrite without a quantified group), unsafe `rules.allow` character-class bodies, dotted field names, unknown country codes, non-`yyyy-MM-dd` date bounds. This is a guardrail, not a sandbox: a hostile config author can still degrade the experience. Hosts loading configs at runtime should wrap the form in an error boundary, since an invalid config throws during render by design.
