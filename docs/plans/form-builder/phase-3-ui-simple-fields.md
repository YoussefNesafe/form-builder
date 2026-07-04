# Phase 3 — UI Shell + Simple Fields

> Part of `docs/plans/2026-07-05-form-builder-implementation.md`. Read overview rules first.

Pattern for every field component: `"use client"`; receives `{ field }`; wires RHF via `Controller` + `useFormContext` (shadcn 4.13 registry removed the RHF-bound `form` component — `components/ui/field.tsx` primitives are markup-only); renders inside `FieldWrapper`; honors `field.disabled` OR disabled-by-condition via `FieldRuntimeContext` (created in Task 3.2, populated by renderer's gate in Phase 5); never hardcodes styling beyond token classes.

Field components have no unit tests (design decision) — visual verification happens in Phase 5 smoke demo and Phase 7 kitchen-sink demo.

## Task 3.1: ui/variants.ts + ui/FieldWrapper.tsx

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

`FieldWrapper.tsx` (`"use client"`): thin composition over shadcn `Field/FieldLabel/FieldDescription/FieldError` (from `@/components/ui/field` — the `form` component no longer exists in the registry; `FieldError` accepts an `errors` prop that maps onto Controller's `fieldState.error`). Props: `{ label?, description?, required?, size?, error?, children }`. Required renders `<span aria-hidden className="text-destructive ms-1">*</span>`. All spacing logical (`ms-*`). No colors beyond tokens.

**Steps:** implement → `yarn tsc --noEmit` → commit `feat: add field wrapper and cva variants`.

## Task 3.2: components/FieldRuntime.tsx (context only)

**Files:** Create `form-builder/components/FieldRuntime.tsx`:
```tsx
"use client";
import { createContext, useContext } from "react";

export const FieldRuntimeContext = createContext<{ disabled: boolean }>({ disabled: false });
export const useFieldRuntime = () => useContext(FieldRuntimeContext);
```
`FieldGate` (condition evaluation) is added to this file in Phase 5 — context ships first so field components below can import it and compile.

**Steps:** implement → `yarn tsc --noEmit` → commit `feat: add field runtime context`.

## Task 3.3: TextField.tsx
Handles `text | email | password | textarea | number`. Password: local `showPassword` state + ghost Button toggle (`aria-label` from `field.label`). Number: `<Input type="number" min max step>`, value coerced via `onChange: e => onChange(e.target.valueAsNumber ?? undefined)`. Textarea: shadcn `Textarea`. Email: `type="email" inputMode="email"`.

## Task 3.4: CheckboxField.tsx
Three modes: boolean checkbox (shadcn `Checkbox`), `switch` (shadcn `Switch`), checkbox group when `options` present (value: `(string|number)[]`, toggle handler).

## Task 3.5: RadioField.tsx
shadcn `RadioGroup` + `RadioGroupItem` per option, option `disabled` honored.

## Task 3.6: HiddenField.tsx
Renders `null`. Value injected via defaults in `useDynamicForm` (Task 4.4) — component exists only so registry resolves the type.

## Task 3.7: StaticField.tsx
No RHF wiring. `as` switch: `h1`→`<h1 className="text-3xl font-semibold">`, `h2`→`<h2 className="text-xl font-semibold">`, `p`→`<p className="text-muted-foreground">`, `divider`→shadcn `Separator`. Default `p`.

## Task 3.8: SubmitField.tsx
shadcn `Button type="submit" variant={field.variant}`; disabled while `formState.isSubmitting`; label = `field.text`.

**Each field task:** implement → `yarn tsc --noEmit` → commit (`feat: add <X> field`).

## Task 3.9: fields/index.ts (incremental registration)
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
  registerField("radio", RadioField);
  registerField("hidden", HiddenField);
  registerField("static", StaticField);
  registerField("submit", SubmitField);
  // extended in Phase 6 as complex fields land
}
```
Commit: `feat: register built-in fields`.
