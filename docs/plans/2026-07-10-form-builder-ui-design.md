# Form Builder UI — Design

**Date:** 2026-07-10
**Status:** Approved, moving to implementation plan.

## Goal

Turn the home page (`app/page.tsx`) into an interactive form-builder UI: compose a form
visually, preview it live with the real engine, and copy out the resulting `FormConfig` (TS or
JSON) to paste into a page or CMS. Reference feel: react-hook-form.com/form-builder, but exposing
this engine's full config surface.

## Scope decisions (locked with user)

- **Full power, all props** — every built-in field type and every prop in `form-builder/core/types.ts`.
- **3-pane layout** — field list (left) + live preview via the real `FormRenderer` (center) + prop editor (right); code output toggled in the output pane.
- **Steps supported** — author multi-step wizards (`steps[]`).
- **Export only** — no import/round-trip in v1.
- **localStorage autosave** — builder state persists across refresh; reset button clears.
- **Stub handlers in preview** — otp demo code, file no-op, submit logs captured values.
- **Dark theme** — dark surface colors, not white. Flat style (border-color states, no shadow/ring emphasis).
- **Triplicated-px responsive system** — mobile / `tablet:` (481px) / `desktop:` (1025px); every size utility written 3×. Per `ui-responsive-breakpoints` skill.

## Where it lives

- `app/page.tsx` renders the builder (home = builder).
- Builder code under **`components/builder/`** — app-side only. The portable `form-builder/`
  package stays clean; the preview consumes it exactly as any host would.

## State model (the crux)

Builder state is NOT a `FormConfig` directly. Names go empty/duplicate mid-edit, so a config keyed
by `name` breaks. Instead:

- Internal node tree: `BuilderNode = { _id: string; type: FieldType; props: Record<string, unknown> }`.
  Groups nest `children: BuilderNode[]`. `_id` is stable; `name` is just another prop.
- Steps referenced by `_id` internally; resolved to `fieldNames` only at export.
- **zustand** store (already a dep) holds: `nodes`, `steps` (`{ title, nodeIds }[]`), `multiStep`,
  `selectedId`, `outputMode` (`"ts" | "json"`). `persist` middleware → localStorage.
- **Serializer** = pure fn `nodes → FormConfig`. Single source feeding BOTH the live preview and the
  code output. `id` auto-slugged from `title`.

## Prop editor — descriptor registry

One registry drives the whole right pane generically (keeps 20+ types maintainable — no bespoke form per type):

```ts
type PropControl =
  | "text" | "number" | "boolean" | "textarea" | "select"
  | "options" | "condition" | "width" | "fieldRef" | "stringList"
  | "mask" | "complexity" | "penColor" | "json";

type PropDescriptor = {
  key: string;
  label: string;
  control: PropControl;
  options?: { label: string; value: string }[]; // for control:"select"
  refKind?: "otp" | "countrySource" | "any";      // for control:"fieldRef"
  help?: string;
};

const FIELD_PROPS: Record<FieldType, PropDescriptor[]>;
```

- **Base descriptors** shared by most types: `name`, `label`, `description`, `placeholder`,
  `required`, `disabled`, `width`, `visibleWhen`, `disabledWhen`, `enabledWhenVerified`.
  `static` / `hidden` / `submit` opt out of base and define their own.
- **Special controls:**
  - `options` — OptionsEditor: rows of `{ label, value, disabled }`, add/remove/reorder.
  - `condition` — ConditionEditor: sibling-field dropdown + `equals` / `notEquals` / `in` + value.
  - `width` — WidthEditor: `full|half|third|quarter`, single value or per-breakpoint object.
  - `fieldRef` — dropdown of *eligible* siblings only (`dependsOn` → otp sources; `countryFrom` →
    country/single-select siblings; `enabledWhenVerified` → otp fields).
  - `stringList` — preferredCountries / countries (ISO codes).
  - `mask`, `complexity`, `penColor`, `json` (hidden `value`).
- Covers the `types.ts` union 1:1.

## Live preview (center)

- Renders the **real `FormRenderer`** on the serialized config.
- Resilience: mid-edit configs are frequently invalid (dup/empty names). Wrap in an **error boundary**
  and gate on `validateFormConfig` — on failure show an issues panel instead of crashing.
- Debounced rebuild. Renderer keyed on a **structural** hash (types/order/steps/otp wiring) so it
  remounts on structural change but NOT on every keystroke (preserves input focus).
- **Stub handlers:** `onSendOtp`/`onVerifyOtp` accept a demo code per length; file upload no-ops;
  `onSubmit` logs to a "submitted values" panel. phone/country work standalone.

## Field list (left)

- **Add**: "+" opens a grouped type picker (Text / Choice / Date & Time / Advanced / Layout).
- Per row: select, move up / down, duplicate, delete. (No dnd canvas — matches 3-pane pick; native drag deferred.)
- Groups render indented; selecting a group allows adding child nodes.
- **Steps**: `multiStep` toggle → step tabs strip; each field assigned to a step via dropdown.
  Off = single flat list.

## Output (right / drawer)

- **TS**: `export const config: FormConfig = {…}` pretty-printed.
- **JSON**: `JSON.stringify(config, null, 2)`.
- Copy button. Inline `validateFormConfig` errors surface config problems.

## Persistence

- zustand `persist` → localStorage key `form-builder-draft`. **Reset** clears to blank.

## Testing (vitest)

- Serializer: nodes → `FormConfig` matches expected and passes `validateFormConfig`.
- Registry completeness: every built-in type has descriptors; every `FieldConfig` prop is reachable.
- Step mapping: `_id` refs → correct `fieldNames`; reorder keeps mapping.
- Name uniqueness / empty detection blocks export with a message.
- Field-ref props offer only eligible siblings; deleting a referenced field warns + clears.

## Non-goals (v1)

Import / round-trip, dnd canvas, custom registered-type UI (built-ins only), cross-field rules the
engine lacks (`matches`, etc. — tracked in form-builder deferred suggestions).
