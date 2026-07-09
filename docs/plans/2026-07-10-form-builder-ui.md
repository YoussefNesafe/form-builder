# Form Builder UI Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. UI work MUST follow the `ui-responsive-breakpoints` skill (triplicated-px, `tablet:`/`desktop:`, no `sm:`/`md:`/`lg:`). Dark theme surfaces, flat style (border-color states, no shadow/ring emphasis).

**Goal:** Turn the home page into an interactive form builder — compose a form visually, preview it live with the real engine, copy out the `FormConfig` (TS or JSON).

**Architecture:** App-side `components/builder/` consumes the portable `form-builder/` package as a host. A zustand store holds a stable-`_id` node tree; a pure serializer turns nodes into a `FormConfig` that feeds BOTH the live `FormRenderer` preview and the code output. A descriptor registry (`FIELD_PROPS`) drives a generic prop editor for all 20+ field types.

**Tech Stack:** Next.js 16 / React 19 / zustand (persist) / RHF 7 / Zod 4 / Tailwind 4 / vitest. Reuses `FormRenderer`, `validateFormConfig`, `types.ts`.

**Process (per user):** Execute a phase → run a code-reviewer subagent → fix findings → re-review until clean → next phase. After the last phase: `yarn build`, commit, push.

---

## Phase 1: Node model + store + serializer (pure logic, no UI)

**Files:**
- Create: `components/builder/model/types.ts` — `BuilderNode`, `BuilderStep`, `BuilderState`.
- Create: `components/builder/model/serialize.ts` — `serialize(nodes, steps, meta) => FormConfig`.
- Create: `components/builder/model/serialize.test.ts`
- Create: `components/builder/model/store.ts` — zustand store + `persist`.
- Create: `components/builder/model/ids.ts` — `newId()` counter-based id helper (deterministic-friendly).

**Node model:**
```ts
export type BuilderNode = {
  _id: string;
  type: FieldType;
  props: Record<string, unknown>;   // includes `name`, `label`, type-specific props
  children?: BuilderNode[];         // groups only
};
export type BuilderStep = { title: string; nodeIds: string[] };
```

**Serializer contract:**
- Strips `_id`; emits `{ type, ...props }` per node (drops empty-string / undefined props).
- Groups: recurse `children` into `fields`.
- Steps: when `multiStep`, map each `nodeIds` → `fieldNames` (skip ids no longer present); emit `steps`.
- `id` = slug of `title` (fallback `"untitled-form"`).

**Steps (TDD):**
1. Write `serialize.test.ts`: single text node → `{ id, title, fields:[{type:"text",name:"a",label:"A"}] }`; empty props dropped; group nesting; multiStep name mapping; slug of title.
2. Run `yarn test serialize` → FAIL.
3. Implement `serialize.ts`.
4. Run → PASS.
5. Store: `store.ts` with actions `addNode(type, parentId?)`, `updateProps(id, patch)`, `moveNode(id, dir)`, `duplicateNode(id)`, `removeNode(id)`, `selectNode(id)`, `setMeta`, `setOutputMode`, `toggleMultiStep`, step actions, `reset`. `persist` key `form-builder-draft`.
6. Store test: add → update → serialize round-trips; remove clears selection + step refs.
7. Commit: `feat(builder): node model, zustand store, config serializer`.

**Review gate:** code-reviewer subagent on Phase 1 diff. Fix → re-review until clean.

---

## Phase 2: Prop descriptor registry

**Files:**
- Create: `components/builder/model/fieldProps.ts` — `PropDescriptor`, `PropControl`, `BASE_PROPS`, `FIELD_PROPS`, `DEFAULT_PROPS` (initial props per type on add).
- Create: `components/builder/model/fieldProps.test.ts`
- Create: `components/builder/model/fieldMeta.ts` — type picker groups + labels + icons.

**Contract:**
- `FIELD_PROPS[type]` returns ordered descriptors (base + type-specific), except `static`/`hidden`/`submit` which define their own.
- `DEFAULT_PROPS[type]` gives required initial props so a freshly-added field serializes to a valid-ish config (e.g. `otp` → `{ length: 6 }`, `slider` → `{ min:0, max:100 }`, `submit` → `{ text:"Submit" }`).

**Steps (TDD):**
1. Test: every `BUILT_IN_FIELD_TYPES` entry has a `FIELD_PROPS` entry; every prop in the `types.ts` union for a sampled set of types is present as a descriptor key; `DEFAULT_PROPS[type]` + empty edits serialize + pass `validateFormConfig` for each type.
2. Run → FAIL.
3. Implement registry covering all types/props from `form-builder/core/types.ts`.
4. Run → PASS.
5. Commit: `feat(builder): field prop descriptor registry`.

**Review gate.**

---

## Phase 3: Builder shell + field list pane (dark, responsive)

**Files:**
- Create: `components/builder/FormBuilder.tsx` — 3-pane shell (`"use client"`).
- Create: `components/builder/FieldList.tsx`, `FieldListRow.tsx`, `AddFieldMenu.tsx`.
- Create: `components/builder/ui/` small primitives if needed (reuse `components/ui/*` shadcn first).
- Modify: `app/page.tsx` → render `<FormBuilder />`.

**Requirements:**
- Dark surfaces (e.g. `bg-zinc-950` / panels `bg-zinc-900` / borders `border-zinc-800`) — NOT white.
- Triplicated-px sizing throughout; `tablet:`/`desktop:` only.
- 3 columns on desktop; stack/collapse on mobile (list → preview → editor order).
- List rows: label/name, type badge, select highlight (border-color), move up/down, duplicate, delete.
- Groups indented with child add.
- `AddFieldMenu`: grouped type picker from `fieldMeta.ts`.

**Steps:** build shell + list, wire to store, `app/page.tsx`. Component test: adding a type via menu appends a row; move/duplicate/delete mutate order. Commit: `feat(builder): shell + field list pane`.

**Review gate** (include `ui-responsive-breakpoints` checklist: grep for `sm:|md:|lg:`, rem-scale utilities).

---

## Phase 4: Prop editor pane

**Files:**
- Create: `components/builder/PropEditor.tsx` — renders descriptors for the selected node.
- Create: `components/builder/controls/` — `OptionsEditor.tsx`, `ConditionEditor.tsx`, `WidthEditor.tsx`, `FieldRefSelect.tsx`, `StringListEditor.tsx`, `ComplexityEditor.tsx`, plus text/number/boolean/textarea/select/mask/penColor/json inline.
- Tests: `controls/*.test.tsx` for OptionsEditor, ConditionEditor, WidthEditor, FieldRefSelect.

**Requirements:**
- Generic: iterate `FIELD_PROPS[node.type]`, render the control per `control`, write back via `updateProps`.
- `FieldRefSelect` lists only eligible siblings by `refKind`; deleting a referenced field elsewhere clears/warns.
- Dark + triplicated-px + flat.

**Steps:** TDD each special control (add option row, set condition operator+value, per-breakpoint width, eligible-ref filtering), then compose `PropEditor`. Commit: `feat(builder): prop editor + special controls`.

**Review gate.**

---

## Phase 5: Live preview pane

**Files:**
- Create: `components/builder/Preview.tsx` — real `FormRenderer` on serialized config.
- Create: `components/builder/PreviewBoundary.tsx` — error boundary.
- Create: `components/builder/previewStubs.ts` — otp/file/submit stubs.
- Create: `components/builder/useStructuralKey.ts` — structural hash of nodes/steps.
- Test: `Preview.test.tsx` (renders a text field; invalid config shows issues panel, no crash).

**Requirements:**
- Gate on `validateFormConfig`; on issues show panel not crash.
- Debounced rebuild; remount on structural key change only.
- Stub `onSendOtp`/`onVerifyOtp` (demo code), `onSubmit` → captured-values panel.
- Dark + responsive.

**Steps:** TDD boundary + stubs, compose Preview, wire into center pane. Commit: `feat(builder): live preview with stubs + error boundary`.

**Review gate.**

---

## Phase 6: Steps authoring + output pane + persistence

**Files:**
- Create: `components/builder/StepsBar.tsx` — multiStep toggle, step tabs, add/rename/remove step, per-field step assignment.
- Create: `components/builder/OutputPane.tsx` — TS/JSON toggle, copy, `validateFormConfig` errors.
- Create: `components/builder/serializeCode.ts` — `toTs(config)` / `toJson(config)` pretty printers.
- Tests: `serializeCode.test.ts` (TS snippet parses shape; JSON round-trips), step assignment mapping.

**Requirements:**
- TS output: `export const config: FormConfig = {…}` with a leading import comment.
- Copy button; inline validation errors.
- Persistence already via `persist` (Phase 1) — add a visible **Reset** button here.

**Steps:** TDD serializers + step mapping, build UIs, wire. Commit: `feat(builder): steps authoring, code output, reset`.

**Review gate.**

---

## Phase 7: Integration, build, ship

**Steps:**
1. Manual pass in dev (`yarn dev`) — build a small multi-step form, verify preview + copy TS + paste sanity.
2. `yarn lint` → fix.
3. `yarn test` → all green (incl. existing 125+).
4. `yarn build` → success.
5. Final code-reviewer subagent on the whole `components/builder/` surface. Fix → re-review.
6. Commit any fixups; `git push`.

**Review gate:** final full-surface review before push.
