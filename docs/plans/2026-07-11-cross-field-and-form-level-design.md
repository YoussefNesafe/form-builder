# Cross-field + form-level features — design

Date: 2026-07-11. Status: approved (discussion phase, pre-implementation).
Scope: everything from the deferred list except async validation and RTL/i18n
(each gets its own design pass later).

## 1. Cross-field validation rules

`matches` (confirm password/email) and date/time ordering across two fields.

### Config surface

- Text family (`text`, `email`, `password`, `textarea`): `rules.matches: "<sibling>"` +
  optional `rules.matchesMessage`.
- `date`: `minDateField` / `maxDateField: "<sibling date field>"`.
- `time`: `minTimeField` / `maxTimeField: "<sibling time field>"`.
- Comparisons stay lexicographic on the plain `yyyy-MM-dd` / `HH:mm` strings —
  repo convention, no Date math.

### Mechanism

Rules are hoisted to a form-level zod `superRefine` — NOT the field's own
schema. Hard constraint from the condition work: the `isFieldValid` oracle
safeParses a field's schema in isolation; a cross-field rule inside it would
break every `isValid` condition. Precedent: the otp verified-registry refine.

- Error attaches to the field **declaring** the rule (the confirm field, the
  end-date field), via the refine issue path.
- Rule is skipped when the declaring field's value is empty (`required`
  covers empties — no double error) and when the **source** field is
  condition-hidden (its value is stripped; comparing against `undefined`
  would hard-fail an unfixable error).
- Documented quirk: `isValid` conditions reflect own-schema validity only —
  a confirm field can be `isValid: true` while showing a mismatch error.

### Validator

- Source: same-level sibling, exists, not self. Group-nested → error
  (precedent: all cross-field wiring).
- Type compatibility: `matches` source must be in the text family (family-
  level, not same-type — an email may match a text field);
  `minDateField`/`maxDateField` source must be a `date` field (non-range);
  time likewise.
- The `matches` compare runs on PARSED values (zod object checks see parse
  output), so `trim` interplay is correct: trimmed-equal values match.
- RHF applies resolver errors per-changed-field; `useDynamicForm` watches
  cross-rule sources and re-triggers touched-or-errored declaring fields so
  the confirm error clears/appears when the source changes.
- Cross-step source → dev-warn (error shows on a step where the cause is
  invisible).

### Messages

New `messages` entries: `matches(label)`, `dateAfter(label)` /
`dateBefore(label)`, `timeAfter(label)` / `timeBefore(label)`.

### Builder

`rules.matches` → fieldRef row in RulesEditor (same-type refKind);
`minDateField`/`maxDateField`/`minTimeField`/`maxTimeField` → fieldRef
descriptors with new refKinds (`dateSource`, `timeSource`).

## 2. Server error mapping

`onSubmit` may return (or resolve to)
`{ fieldErrors?: Record<string, string>; formError?: string }`.

- Renderer maps `fieldErrors` → `setError(name, { type: "server", message })`;
  group paths (`team.0.role`) pass through as-is.
- Unknown field names fold into `formError`; `formError` renders in a new
  root-error slot at the end of the form (submit lives inside the field
  grid, so "above the submit row" is not a real slot).
- First errored (visible) field gets focus; multi-step: stepper jumps to the
  first step containing an errored field.
- Server errors clear on the next change of the errored field (RHF default
  for manual errors cleared on re-validation).
- Exported standalone `applyServerErrors(setError, result, fields)` for
  headless/custom hosts. Dotted paths whose root is not a group field fold
  into `formError` (a nested error under a scalar field renders nowhere).
- Quirk: the cross-rule re-trigger (section 1) can clear a server error on a
  cross-rule DECLARING field when its source changes and the field passes
  client validation — same wipe RHF's own `deps` mechanism produces.
- Known pre-existing issue (filed, not fixed here): a submit button that
  mounts late (multi-step last step) reads `isValid` through the context
  formState proxy and misses the recompute-on-subscription effect that only
  `useFormState` has — reaching the last step without a `trigger` (e.g.
  programmatic `goTo`) can leave it disabled until any field event. Robust
  fix when picked up: SubmitField switches to `useFormState({ control })`.

## 3. Draft autosave

`FormRenderer` prop `autosave?: { key?: string; debounceMs?: number; includeSignatures?: boolean }`.

- Debounced (default 500ms) `watch` subscription → localStorage.
- Storage key: `form-builder:draft:<autosave.key ?? config.id>`; the
  structural hash over the fields config lives INSIDE the payload — a
  changed form drops its stale draft on load, and outdated drafts overwrite
  themselves instead of accumulating under dead hashed keys.
- Restore: silent, via `form.reset` in a mount effect — NOT merged into
  `useForm` defaultValues (SSR renders defaults; init-time seeding would
  hydration-mismatch). No banner. Exported `clearDraft(idOrKey)` for hosts.
- Cleared automatically after a submit that reports no server errors.
- Never persisted: `File` values (not serializable, dropped wherever they
  appear); `password` values (plaintext credential at rest); `otp` codes
  (credential, and the verified registry is not persisted — a restored code
  would only be a stale one the refine rejects). `signature` data URLs
  excluded by default (localStorage ~5MB), opt-in via `includeSignatures`.
- `clear()` also cancels a pending debounced save (type-then-submit within
  the debounce window must not resurrect the draft); an effect teardown with
  a pending save flushes it instead of dropping it.
- Two mounted renderers sharing a `config.id` with autosave interleave
  writes last-writer-wins — give each its own `autosave.key`.
- Multi-step: current step index persisted and restored alongside values.
  Step-only navigation persists only once a draft already exists (pristine
  visits write nothing).

## 4. copyFrom (primitive only)

`copyFrom: "<same-type sibling>"` on value fields. No "same as shipping"
payload sugar — authors compose the toggle themselves (checkbox +
`visibleWhen`/`enabledWhen` + `copyFrom`).

- Semantics identical to `useCountryFromSync` (it becomes the generalized
  hook's first consumer): source wins on every source change, manual override
  sticks until the next source change, first render after (re)mount is
  baseline (drafts not clobbered, cross-step changes skipped), seed sets no
  dirty/touched flags.
- Validator: same-level sibling, exists, not self, same type (matching select
  `multiple` / date `range` shape), group-nested → error, cross-step →
  dev-warn, copyFrom cycles → error (array/object mirrors would ping-pong
  forever; chains stay legal). `phone` keeps `countryFrom` (not both);
  otp/password (credentials), file/signature, group and layout types are not
  copy targets.
- A condition-HIDDEN field keeps syncing (FieldGate stays mounted) — hidden
  values are payload-stripped anyway and the field is current when it
  reappears; step-unmounted fields re-baseline on remount instead.
- Draft restore (autosave) bumps a restore generation through
  FieldRuntimeContext; source-sync hooks re-baseline on it rather than
  mirroring the restore as a source edit — otherwise a drafted manual
  override would be clobbered by the restored source value.

## 5. Options-from-source

Select variant: `optionsFrom: { field: "<sibling>"; map: Record<string, Option[]> }`,
mutually exclusive with static `options` (validator error if both, or
neither).

- Runtime options: `map[String(sourceValue)] ?? []`. Empty list renders a
  disabled placeholder state.
- Stale-value invalidation: when the source changes and the current value is
  not in the new option list, the dependent select resets (same class of bug
  as otp `dependsOn` staleness).
- A BLANK source allows nothing: a stale pre-filled dependent value errors
  (`invalidOption`) instead of silently submitting; the lookup never aliases
  into a branch literally keyed "undefined". optionsFrom cycles are rejected
  by the validator (they converge to a dead pair whose every pick clears the
  other side); chains are legal.
- Validation: the field's own schema validates against the UNION of all
  branches (shape + required) — branch membership needs the sibling's value,
  so it lives in the form-level superRefine alongside the cross-field rules
  (the isValid oracle must keep parsing field schemas in isolation). New
  message: `invalidOption`.
- Validator: source sibling exists/not self/not group-nested; source must be
  a single-value select or country field (dynamic selects allowed as sources
  — chains; resets converge to blank, no loop); dev-warn when a STATIC
  source option value has no key in `map` (empty dependent branch); phone
  `countryFrom` may NOT point at an optionsFrom select (values not
  statically verifiable as ISO).
- Builder: mapping editor (per source-option key → options list) — the
  biggest builder cost in this batch; reuses OptionsEditor per key.

## 6. Conditional steps

Step config gains `visibleWhen?: ConditionSpec` — value operators only (same
feedback argument as field visibleWhen; the validator rejects isValid).

- Hidden step ⇒ its fields are condition-hidden everywhere: excluded from the
  validation schema, stripped from the submit payload, skipped by the
  stepper. Single source: effective field visibility = own `visibleWhen` AND
  owning step visible.
- Stepper: progress dots/labels hide invisible steps; next/back resolve to
  the nearest visible step; step indices in the store are config indices
  (visibility filters at render/navigation time).
- Dev-warn when a step's visibleWhen sources live on later steps (visibility
  decided by values the user has not reached — legal, defaults decide, but
  usually a config smell). Dev-warn when every step could be hidden; at
  runtime an all-hidden wizard renders nothing (+ dev-warn).
- If the CURRENT step turns hidden under the user, the stepper moves to the
  nearest visible step (next preferred, else previous); the render guard and
  the fallback effect share the destination, so no transient wrong-step frame.
- Server-error mapping skips the step-jump/focus when the errored field's
  step is hidden under current values (the jump would bounce and the error
  stays invisible — documented limitation, same family as dotted paths under
  non-group roots).
- Builder: per-step "Visible when" ConditionEditor in the StepsPanel (value
  ops only — no validityOps); step conditions serialize onto the step config
  and scrub their leaves when the referenced field is deleted.

## 7. Review step

Step config gains `review: true` — a step with no `fieldNames` (validator:
`review` and `fieldNames` are mutually exclusive; review steps are exempt
from the every-field-in-a-step rule).

- Renders a read-only summary of all **visible** fields from earlier visible
  steps, grouped by step, in config order.
- Per-type formatting: option labels (select/radio/segmented/checkbox-group),
  `formatMasked` for masked, country labels via the locale chain, date/time
  as-is, group rows as sub-lists, files as names, booleans via messages
  (yes/no), passwords masked as `••••`, otp shown as verified state.
- Custom field types: host formatter map prop (`reviewFormatters`), fallback
  `String(value)`.
- Edit affordance: per-step section header links back to that step
  (`goToStep`); no per-field links in v1.
- Values re-read live from form state — arriving back at the review step
  always reflects current values.

## Sequencing (each phase: code → code-review → fix)

1. Cross-field rules (engine + builder fieldRefs)
2. Server error mapping
3. Draft autosave
4. copyFrom (generalize useCountryFromSync)
5. Options-from-source (engine, then builder mapping editor)
6. Conditional steps
7. Review step

Ordering rationale: 1 unblocks the most common real-world gap
(confirm-password); 2–4 are small and independent; 5–7 stack on each other
(review step wants conditional-step visibility semantics settled first).

## Out of scope

- Async validation (own design: debounce, race with value changes, loading
  states, submit gating).
- RTL + i18n audit (own design).
- "Same as shipping" payload sugar.
- Per-field edit links in the review step.
