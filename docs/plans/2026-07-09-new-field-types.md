# New Field Types Implementation Plan

> **For Claude:** Phase-review execution (user-prescribed): execute each phase, then dispatch a code-reviewer subagent, fix findings, re-review until clean, then commit + push to master before starting the next phase. No user approval gates — all pre-approved.

**Goal:** Add six built-in field types — `time`, `rating`, `segmented`, `country`, `masked`, `signature` — per the approved design at `docs/plans/2026-07-09-new-field-types-design.md`.

**Architecture:** Each type follows the established built-in pattern: `BUILT_IN_FIELD_TYPES` + `FieldConfig` union (`core/types.ts`), per-type zod config entry + second-pass checks (`core/schema.ts`), value schema (`core/validation.ts`), messages (`core/messages.ts`), one component in `fields/`, registration in `fields/index.ts`. TDD per phase: config-validation tests → value-validation tests → component tests → implementation.

**Tech Stack:** Next.js 16 / React 19 / RHF 7 / Zod 4 / Tailwind 4 (three custom breakpoints, px triplication), radix-ui ToggleGroup, libphonenumber-js `getCountries()`, `react-phone-number-input/flags`, `signature_pad` (new dep, Phase 6 only).

**Repo rules that bind every phase (AGENTS.md):**
- Sizing: px arbitrary values triplicated — `text-[14px] tablet:text-[14px] desktop:text-[14px]`. Never `sm:`/`md:`/`lg:`, never rem-scale utilities.
- Flat style: states via border color only. No shadows, no rings.
- Components: `"use client"`, `Controller` + `useFormContext`, `FieldWrapper`/`fieldAriaDescribedBy`, `useFieldDisabled`, `useId` — copy the shape of `CheckboxField.tsx`/`RadioField.tsx`.
- `validateFormConfig` runs in production — no NODE_ENV guards on validation rules (dev-warns use the existing warn helper pattern).
- Test commands: `yarn test` (full), `yarn lint`, `yarn build`.

---

## Phase 1: Time field

**Files:**
- Modify: `form-builder/core/types.ts` (union + BUILT_IN_FIELD_TYPES)
- Modify: `form-builder/core/schema.ts` (zod entry + second-pass: minTime/maxTime HH:mm valid, min ≤ max, stepMinutes positive int)
- Modify: `form-builder/core/validation.ts` (value schema)
- Modify: `form-builder/core/messages.ts` (`invalidTime`)
- Create: `form-builder/fields/TimeField.tsx`
- Modify: `form-builder/fields/index.ts` (register)
- Test: `form-builder/core/schema.test.ts`, `form-builder/core/validation.test.ts`, `form-builder/fields/TimeField.test.tsx`

**Config:** `BaseField & { type: "time"; minTime?: string; maxTime?: string; stepMinutes?: number }`

**Steps (TDD):**
1. schema.test: `describe("time config")` — accepts valid config; rejects bad `minTime` format ("25:00", "9:00"); rejects `minTime > maxTime`; rejects `stepMinutes: 0` / negative / non-integer. Run → fail.
2. schema.ts: zod entry + second-pass checks. Run → pass.
3. validation.test: value schema — accepts "09:30"; rejects "24:00", "9:30", "09:60", "" when required (messages.required); enforces minTime/maxTime bounds lexicographically (messages.min/max with the bound string); optional + "" → parsed out (optionalEmptyable).
4. validation.ts case:
   ```ts
   case "time": {
     const base = field.required ? z.string({ error: messages.required }).min(1, messages.required) : z.string();
     let schema: z.ZodType = base.refine((v) => /^([01]\d|2[0-3]):[0-5]\d$/.test(v as string), messages.invalidTime);
     if (field.minTime !== undefined) schema = schema.refine((v) => (v as string) >= field.minTime!, messages.min(field.minTime));
     if (field.maxTime !== undefined) schema = schema.refine((v) => (v as string) <= field.maxTime!, messages.max(field.maxTime));
     return field.required ? schema : optionalEmptyable(schema);
   }
   ```
   Add `invalidTime: "Enter a valid time"` to messages. Run → pass.
5. TimeField.test: renders label + native time input; change fires RHF value "13:45"; disabled honored; error text renders.
6. TimeField.tsx — native `<input type="time">` reusing the flat Input component (`components/ui/input.tsx`); wire `min`/`max`/`step` (stepMinutes × 60) attributes; register in fields/index.ts. Run → pass.
7. Full `yarn test` + `yarn lint`.
8. **Code-reviewer subagent → fix → re-review until clean.**
9. Commit `feat(core): add time field type` + push.

## Phase 2: Rating field

**Files:** same core files; Create `form-builder/fields/RatingField.tsx`; Test `RatingField.test.tsx`.
**Also:** rename custom-type probes `"rating"` → `"probe-field"` in `form-builder/core/schema.test.ts:246,256` and `form-builder/core/core-units.test.ts:28` (collides once `rating` is built-in).

**Config:** `BaseField & { type: "rating"; max?: number }` (default 5)

**Steps:**
1. Rename probe types first; full test run stays green.
2. schema.test: accepts valid; rejects `max: 1`, `max: 11`, `max: 3.5`. → schema.ts second pass (`max` int 2–10). 
3. validation.test: int 1..max; rejects 0, 6 (max 5), 2.5; optional cleared (null/NaN) → undefined via optionalClearable; required missing → messages.required.
4. validation.ts case: `z.number({ error: messages.required }).int(...).min(1, ...).max(field.max ?? 5, messages.max(...))`; optional → optionalClearable.
5. messages: `ratingValue: (n, max) => \`${n} of ${max}\``.
6. RatingField.test: renders `max` stars as radiogroup; click star 3 → value 3; ArrowRight from 3 → 4; click current value clears when optional, stays when required; disabled blocks.
7. RatingField.tsx: `role="radiogroup"` + buttons `role="radio"`, `aria-checked`, aria-label `ratingValue(n, max)`; lucide `Star` (fill on selected via `fill-current`, color state via existing border/primary tokens — flat); roving tabindex + Arrow keys; register.
8. Full suite + lint → **review loop** → commit `feat(core): add rating field type` + push.

## Phase 3: Segmented field

**Files:** core files; Create `form-builder/fields/SegmentedField.tsx`; Test `SegmentedField.test.tsx`.

**Config:** `BaseField & { type: "segmented"; options: Option[] }`

**Steps:**
1. schema.test: mirrors radio rules (options required non-empty). schema.ts: reuse radio's option schema shape.
2. validation.test + validation.ts: identical to radio — `optionValueSchema(field.options, ...)`, optional → optionalClearable. Consider `case "radio": case "segmented":` shared branch.
3. SegmentedField.test: renders options as buttons; click selects (RHF value = option value incl. number values); disabled option skipped; error renders.
4. SegmentedField.tsx: radix ToggleGroup single (`radix-ui` package — check how other components import radix; shadcn has no toggle-group installed, build directly on radix primitive with flat classes: bordered group, selected = `border-primary` + subtle bg, no rings). Register.
5. Full suite + lint → **review loop** → commit `feat(core): add segmented field type` + push.

## Phase 4: Country field + countryFrom source upgrade

**Files:** core files; Create `form-builder/fields/CountryField.tsx`; Modify `form-builder/core/schema.ts` countryFrom second-pass; Test `CountryField.test.tsx` + schema.test countryFrom cases.

**Config:** `BaseField & { type: "country"; countries?: string[]; preferredCountries?: string[] }`

**Steps:**
1. schema.test: rejects invalid ISO in `countries`/`preferredCountries` (validate against `getCountries()`); rejects `preferredCountries` entries outside `countries` when both set; accepts valid.
2. schema.ts second pass. 
3. countryFrom upgrade — schema.test: phone `countryFrom` pointing at a `country` field is accepted with zero option checks; still rejects multi-select/non-select-non-country sources; cross-step dev-warn unchanged. schema.ts: extend the source check (`select` single-valued-ISO OR `country`).
4. validation.test: value must be in allowed set (subset if `countries`, else `getCountries()`); rejects "XX", lowercase "nl"; optional cleared → undefined.
5. validation.ts case: build a Set once per schema build; `z.string(...).refine((v) => allowed.has(v), messages.required /* or invalid-country? reuse pattern */)` — add message `invalidCountry: "Select a valid country"`.
6. CountryField.test: renders combobox; open lists countries with names; search filters; pick sets ISO value; preferred sort first; works as countryFrom source (integration: render country + phone via FormRenderer, change country → phone value gets +calling-code — mirrors PhoneField.test patterns).
7. CountryField.tsx: copy SelectField's searchable command-popover pattern; options from `countries ?? getCountries()`; labels `new Intl.DisplayNames(undefined, { type: "region" })` with fallback to code; flag component `flags[iso]` from `react-phone-number-input/flags` (fixed width ~ `w-[20px]` triplicated); `preferredCountries` on top with separator. Register.
8. Full suite + lint → **review loop** → commit `feat(core): add country field type; accept country as countryFrom source` + push.

## Phase 5: Masked field

**Files:** core files; Create `form-builder/fields/maskedValue.ts` (pure helpers) + `form-builder/fields/MaskedField.tsx`; Test `maskedValue.test.ts`, `MaskedField.test.tsx`, schema/validation tests.

**Config:** `BaseField & { type: "masked"; mask: string; message?: string }`

**Pure helpers (TDD these hard — they're the logic core):**
```ts
// tokens: # digit, A letter, * alphanumeric; anything else literal
export function maskTokenCount(mask: string): number
export function formatMasked(raw: string, mask: string): string   // "4111111111111111" + "#### #### #### ####" → "4111 1111 1111 1111"
export function extractRaw(display: string, mask: string): string // inverse; drops chars that don't fit next token; caps at token count
```

**Steps:**
1. maskedValue.test: format/extract round-trips; partial raw formats partially; literals auto-inserted; wrong char class dropped ("41ab" against "####" → "41"); raw capped at token count; mask with no tokens → count 0.
2. Implement helpers → pass.
3. schema.test: rejects empty mask, mask without tokens; accepts card mask. schema.ts second pass.
4. validation.test: required + complete (raw length === tokenCount, error = field.message ?? messages.maskIncomplete); incomplete rejected; optional "" → absent.
5. validation.ts case + messages `maskIncomplete: "Incomplete value"`.
6. MaskedField.test: typing "4111111111111111" displays grouped, RHF stores raw; deleting from end updates both; paste formatted string ("4111 1111 …") → raw extracted; maxLength = mask length.
7. MaskedField.tsx: controlled Input; `onChange` → `extractRaw(input.value, mask)` → RHF; render `formatMasked(rhf.value, mask)`; `inputMode="numeric"` when mask tokens are all `#`. Code comment documenting v1 caret limitation (mid-string edits may jump caret; end-typing correct). Register.
8. Full suite + lint → **review loop** → commit `feat(core): add masked field type` + push.

## Phase 6: Signature field

**Files:** `package.json` (+`signature_pad`), core files; Create `form-builder/fields/SignatureField.tsx`; Test `SignatureField.test.tsx` (mock `signature_pad`), schema/validation tests.

**Config:** `BaseField & { type: "signature"; penColor?: string; heightPx?: number }`

**Steps:**
1. `yarn add signature_pad` (check installed version in yarn.lock after).
2. schema.test: rejects `heightPx: 0` / negative / non-int; accepts valid. schema.ts second pass.
3. validation.test: required → must start with `"data:image/"` (reject "", "hello"); optional "" → absent. validation.ts case (reuse messages.required for missing; empty-canvas case = "" so required message covers it).
4. SignatureField.test with `vi.mock("signature_pad")`: mounts canvas; mock `onEnd` handler registered (`addEventListener("endStroke")` — signature_pad v5 uses event emitter: verify actual API from `node_modules/signature_pad/dist` types before writing); simulated endStroke → RHF value = mocked `toDataURL()` return; clear button calls `pad.clear()` + resets value to ""; disabled calls `pad.off()`.
5. SignatureField.tsx: canvas in flat bordered box (`heightPx` default 160, width 100%); instantiate `new SignaturePad(canvas, { penColor })`; `endStroke` → `toDataURL("image/png")` → `rhf.onChange`; clear button (messages.clearSignature) → `pad.clear()` + `onChange("")`; ResizeObserver: on resize re-scale canvas for devicePixelRatio, `const data = pad.toData(); …resize…; pad.fromData(data)`; cleanup `pad.off()` on unmount; disabled → `pad.off()` else `pad.on()`. Register.
6. messages: `clearSignature: "Clear"`.
7. Full suite + lint → **review loop** → commit `feat(core): add signature field type` + push.

## Phase 7: Demo, docs, verification

**Files:**
- Modify: `app/demo/page.tsx` — residence select → `{ type: "country", name: "residence", label: "Country of residence", countries: ["NL","AE","EG","SA"], width: "half" }` (phone `countryFrom` untouched); add: time (`meeting`, minTime 09:00 maxTime 17:00), rating (`satisfaction`), segmented (`plan`, options Basic/Pro/Max), masked (`card`, mask `#### #### #### ####`), signature (`sign`); slot into steps (Profile: segmented; Extras: time, rating, masked, signature). Checkbox-group demo too (exists already, zero code): give `other` field options? No — add small `interests` checkbox with options to showcase.
- Modify: `form-builder-spec.md` — six new type entries + checkbox-group mention.
- Modify: `AGENTS.md` — new invariants: masked stores raw (helpers in `maskedValue.ts`), signature ResizeObserver redraw via toData/fromData, country valid as countryFrom source, `"HH:mm"` strings compared lexicographically (no Date math).

**Steps:**
1. Demo edits; `yarn build` green; full `yarn test` + `yarn lint`.
2. Live browser verify on /demo (playwright MCP): time picker, rating click+keyboard, segmented select, country search → phone re-sync still works (regression!), masked typing/paste, signature draw + clear + resize, submit payload shapes (raw card digits, ISO country, HH:mm).
3. Spec + AGENTS.md updates.
4. **Code-reviewer subagent on the whole feature (holistic) → fix → re-review.**
5. Commit `docs+demo: showcase new field types` + push. Confirm CI + CodeQL green on GitHub.

---

## Deferred review findings (revisit in Phase 7 or later)

- Radiogroup accessible name: both RadioField and RatingField rely on FieldWrapper's fieldset/legend for naming; the `role="radiogroup"` element itself is unnamed. Joint fix: give FieldLegend an id + `aria-labelledby` on both. (Phase 2 review, Minor.)
- Time HH:mm regex duplicated in schema.ts and validation.ts — shared constant candidate. (Phase 1 review, Minor.)
- rating `.int()` error message reads as "required" — cosmetic, unreachable via UI. (Phase 2 review, Minor.)
- Shared config-validation rule: reject duplicate `String(value)` within any options list (radio, select, checkbox-group, segmented) — mixed-type duplicates (`2` vs `"2"`) render broken controls silently. Pre-existing, not segmented-specific; also consider rejecting `value: ""` (collides with the unset sentinel). (Phase 3 review, Minor.)

**Per-phase review protocol (applies to every phase):** dispatch `superpowers:code-reviewer` subagent with the phase's commit range + design doc reference; wait for report; fix all Critical/Important findings (and Minor unless disputed); re-dispatch reviewer; repeat until clean; only then commit+push and open next phase.
