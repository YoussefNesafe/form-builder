# Phase 6 — Complex Fields + Group

> Part of `docs/plans/2026-07-05-form-builder-implementation.md`. Read overview rules first.

For each field: check the installed lib's README/types in `node_modules/<pkg>` FIRST (APIs drift). Implement → register in `fields/index.ts` → verify in demo page → commit per field.

## Task 6.1: SelectField.tsx
One component, three modes: plain (shadcn `Select`), searchable (`Command` inside `Popover`, chevron trigger `Button variant="outline"`), multiple (searchable UI + checkbox-style `CommandItem`s, value `(string|number)[]`, selected shown as count or badges). `placeholder` on trigger.

## Task 6.2: OtpField.tsx
shadcn `InputOTP` (input-otp lib): `maxLength={field.length}`, render `InputOTPGroup` with `field.length` slots. Value = string.

## Task 6.3: PhoneField.tsx
`react-phone-number-input`: headless `PhoneInput` with `inputComponent` set to shadcn `Input`; country select restyled with shadcn `Select` or lib default + token classes. `defaultCountry`, preferred countries ordering (verify exact prop names in lib docs). No lib CSS import — style manually (dark mode + RTL safety).

## Task 6.4: DateField.tsx
`react-day-picker` via shadcn `Calendar` inside `Popover`; `mode={field.range ? "range" : "single"}`. Form value: single → ISO string (`date.toISOString()`), range → `{ from: string; to: string }` (JSON-serializable, matches validation schema from Task 4.2). `minDate`/`maxDate` → `disabled={{ before, after }}` matcher. Trigger Button shows formatted value (`date-fns format`) or placeholder.

## Task 6.5: SliderField.tsx
shadcn `Slider`: `min max step`, value `[n]` ↔ scalar in form. Current value displayed `text-muted-foreground`.

## Task 6.6: FileField.tsx
`<input type="file" className="sr-only">` + shadcn `Button` label trigger; `accept`, `multiple`. Client-side `maxSizeMB` check → RHF `setError` on violation. Selected files listed (name + size + remove). Value: `File | File[]`. Note in code: file values are NOT JSON-serializable — consumers handle upload in `onSubmit`.

## Task 6.7: GroupField.tsx (recursive)
`useFieldArray({ name: field.name })`. Renders per row: nested grid, recursion — inner fields rendered through same registry/`FieldGate` path with names prefixed `${field.name}.${index}.${inner.name}` (helper `withNamePrefix(field, prefix)` — unit test the prefixing in small `group.test.ts`). Add-row Button (disabled at `max`), remove Button per row (disabled at `min`). New-row defaults from `buildDefaultValues` of inner fields (exported in Task 4.4).

Commit: `feat: add recursive repeatable group field`.
