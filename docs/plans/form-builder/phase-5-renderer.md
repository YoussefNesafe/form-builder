# Phase 5 — Renderer

> Part of `docs/plans/2026-07-05-form-builder-implementation.md`. Read overview rules first.

## Task 5.1: FieldGate (extend components/FieldRuntime.tsx)

Add to `form-builder/components/FieldRuntime.tsx` (context created in Task 3.2):

```tsx
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
Watches only the condition's source field — no full-form re-render. Verify `useWatch` `disabled` option exists in installed RHF version; if not, always watch and ignore.

Phase 3 review follow-up: extend `FieldRuntimeContext` to `{ disabled, messages }` and have `FormRenderer` provide merged messages — `TextField` password toggle reads `messages.showPassword`/`hidePassword` instead of hardcoded English (approach-A i18n).

Commit: `feat: add condition-driven field gate`.

## Task 5.2: components/FormRenderer.tsx

```tsx
"use client";
type FormRendererProps = {
  config: FormConfig;
  onSubmit: (values: FormValues) => void | Promise<void>;
  messages?: Partial<Messages>;
  className?: string;
};
```
Body: `useDynamicForm` → RHF `<FormProvider {...form}>` → `<form onSubmit={form.handleSubmit(values => onSubmit(stripInvisibleValues(config.fields, values)))} className="grid grid-cols-4 gap-4">` (phase 4 revision: values persist in state; strip condition-hidden values at submit). Per field: registry lookup (`getField(field.type)`), unknown → dev: `<div className="col-span-4 border border-destructive p-2 text-destructive">Unknown field type "X"</div>`, prod: `null`. colSpan map: `{1:"col-span-1",2:"col-span-2",3:"col-span-3",4:"col-span-4"}` (static strings — Tailwind can't see dynamic classes), default 4. Each field wrapped in `FieldGate`.

If `config.steps` present → delegate to `FormStepper` (Phase 7); until then ignore steps.

**Steps:** implement → `yarn tsc --noEmit` → smoke-check: temp `app/demo/page.tsx` with 3-field config (text + checkbox + submit), `yarn dev`, submit logs values, required-field error shows → commit `feat: add FormRenderer walking config via registry`.

## Task 5.3: components/FormSection.tsx
Trivial presentational: title + description + children in `space-y-*`; used by demo and stepper. Commit with 5.2 if small.
