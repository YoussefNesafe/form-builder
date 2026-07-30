# Changelog

All notable changes to `@form-builder/engine` (the headless engine, Unit A of
ADR-0003 — see `docs/adr/0003-packaging-split-distribution.md`) are documented
in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

**Compatibility contract:** the `FormConfig` shape and its constituent types
(`FieldConfig`, `AnyFieldConfig`, `Condition`, `StepConfig`, ... — all defined
in `core/types.ts`) are the semver contract for this package. A change is
breaking (major bump) if it requires an existing, valid `FormConfig` to be
edited to keep working, or removes/renames an exported runtime value
(`useDynamicForm`, `validateFormConfig`, `registerField`, etc.) or exported
type. Additive changes (a new optional field on `FormConfig`, a new exported
helper, a new built-in `FieldType`) are minor. Bug fixes that don't change the
public surface are patch.

Only the surface re-exported from `form-builder/headless.ts` (the package's
sole published entry, `.` in `package.json`'s `exports` map) is covered by
this contract. The rendered UI layer (`ui/`, `components/`, `fields/`) is not
published to npm at all yet (Phase 2 — copy-in/registry distribution, see the
ADR) and carries no semver guarantee from this package.

**Release process.** Versioning and publishing are tag-triggered, not
`@changesets/cli`-managed: bump `form-builder/package.json`'s `version`, add
an entry to this file under a new `## [x.y.z]` heading, commit, then push a
matching `engine-vX.Y.Z` tag to run `.github/workflows/release.yml`. This
repo's root is `"private": true` with no yarn workspaces and no
`packageManager` field — adopting changesets cleanly wants a workspace
(so it can detect which packages changed and version them independently),
and converting the app into a workspace member solely to unlock changesets
for one package was judged not worth the churn/risk for a single published
package with a single hand-maintained changelog. Revisit if a second
publishable package appears in this repo (multi-package versioning is where
changesets earns its keep) or if this changelog becomes a bottleneck in
practice.

## [Unreleased]

Nothing yet.

## [0.2.0] - 2026-07-28

Nothing exported was removed or renamed, and no existing `FormConfig` needs
editing to keep working, so this is a minor bump — but read **Changed** first:
one behaviour tightened, and a config that already sets `accept` will start
rejecting files it used to accept.

Shipped to consumers by the CLI installer (`form-builder-nextjs@0.2.0`, Unit B
— it vendors this source). The npm engine package (Unit A) is still unpublished
and carries no `engine-v0.2.0` tag: its release workflow stays inert until the
placeholder package name is replaced with an owned one, so the version here is
the record of what the copy-in layer ships, not a registry release.

### Changed

- **`accept` is now enforced by validation, per file.** Previously `accept`
  only shaped the browser's file picker, which a drag-and-drop bypasses; the
  schema now rejects a non-matching file and names the file, its format, and
  the accepted formats in the message. **A config that already sets `accept`
  now fails submissions it used to pass** — this is the one behaviour in this
  release that tightens rather than adds, and the only upgrade risk here.
  Tokens are read the way a file picker reads them (`.pdf` against the name,
  `image/*` and `application/pdf` against the MIME type); an uninterpretable
  token matches nothing, so a typo in `accept` narrows the selection instead
  of silently opening it up. Type is checked before size, and every file is
  judged independently of the others.

### Added

- **`AutosaveOptions.storage`** — where drafts live: `"local"` (the default,
  unchanged), `"session"`, or any object implementing the newly exported
  `DraftStorage` (`getItem`/`setItem`/`removeItem`). `DraftStorage` and
  `DraftStorageOption` are exported so a custom store can be annotated
  without reaching into `core/`. `clearDraft(idOrKey, storage?)` takes the
  same option, so a draft written to a non-default store can be cleared from
  it. Note the SSR asymmetry: the built-in `"local"`/`"session"` stores are
  skipped when there is no `window`, but a custom store is used as given and
  will therefore be read and written during server rendering. Keep the object
  referentially stable (module scope or `useMemo`) — a fresh one each render
  re-subscribes the autosave effect.
- **`acceptedFormatsLabel(accept)`** — the accepted formats as prose
  (`".pdf,.jpg,image/*"` → `"PDF, JPG or images"`). Exported so a
  custom file-taking field type can write the same hint the built-in `file`
  field writes rather than re-splitting `accept` at the call site. Returns
  `""` when `accept` names no format at all; render that as a clause you can
  drop, never interpolated into a sentence.
- **Six `Messages` keys**, for the above and for the upload UI:
  `fileTypeRejected`, `fileRejected`, `fileHint`, `dropFiles`,
  `filesSelected`, `oneFileOnly`. Messages are taken as `Partial<Messages>`
  everywhere, so no consumer needs to change anything; the one exception is a
  consumer who hand-authored a *complete* `Messages` literal instead of
  spreading `defaultMessages`, who will now be asked for the new keys.
- **`date.message`** — replaces the generic bound text on a `minDate`/`maxDate`
  violation for that field, so a date expressing a rule can state the rule
  ("You must be 18 or older to open an account"). One sentence serves both
  bounds, and on `range: true` both endpoints. `minDateField`/`maxDateField`
  keep their own messages, which already name the other field. An unparseable
  value still gets `messages.invalidDate`. Must be non-empty
  (`validateFormConfig`-enforced).
- **`date.pickerBounds`** — `"restrict"` (the default, unchanged: out-of-range
  days disabled and month/year navigation clamped) or `"validate"` (those days
  stay selectable and picking one fails with `message`, and the navigable
  window widens to reach the bounds). Picker only — the schema rejects an
  out-of-range value under either setting, so this never widens what a form
  accepts. `minDateField`/`maxDateField` never shaped the calendar under
  either setting.
- **`BaseField.badge`** — a short annotation rendered beside any field's label
  ("Required in Germany"), and, unlike the required `*`, part of the field's
  accessible name. Read off the field runtime context, so custom types
  registered with `registerField` inherit it without passing anything through.
  Needs a `label` to sit beside.
- **`BaseField.autocomplete`** — the control's HTML `autocomplete` attribute,
  which is what **WCAG 2.2 SC 1.3.5 Identify Input Purpose (AA)** requires on
  any field collecting information about the person filling the form. Before
  this there was no way to set it at all, so every config built on this engine
  failed 1.3.5 on its name, email and address fields with no way out short of
  forking a field component.

  Typed `string`, deliberately not a union of the 1.3.5 purposes. The
  attribute's value is a *grammar* — an optional `section-*` group, an optional
  `shipping`/`billing`, an optional `home`/`work`/`mobile`/`fax`/`pager`, then
  the purpose token, then an optional `webauthn`; plus the standalone
  `on`/`off`. The 1.3.5 list is only the purpose slot, so a union of it would
  reject `"section-owner-1 name"`, `"shipping street-address"`, `"mobile tel"`
  and `"off"`, all valid HTML — and the first of those is what a repeating
  `group` of people needs to stop a browser filling every row alike. A wrong
  token is caught by a test on the config, not by the type.

  Reaches the DOM on the types whose control is a native text-entry input:
  `text`, `email`, `password`, `textarea`, `number`, `masked`, `time`, `phone`,
  `otp`. On `date`, `select` and `country` there is no input to carry it (a
  popover behind a `<button>`), and HTML ignores the attribute on `file`,
  `checkbox`/`switch`, `radio` and `segmented` — set there it is inert, not an
  error. `phone` and `otp` already default to `"tel"` and `"one-time-code"`;
  leaving `autocomplete` unset preserves both.

### Rendered UI layer

Copy-in/registry distribution only — not published to npm, and outside this
package's semver contract (see "Not included (by design)" under 0.1.0).
Recorded here because a copy-in consumer has no other changelog.

- `FormRenderer` gained **`step`** and **`onStepChange`**, which *share* the
  wizard step with a host router rather than controlling it: the wizard still
  advances on its own validation gate, clamps an out-of-range index, redirects
  away from a step hidden by `visibleWhen`, and reports where it actually
  landed. `onStepChange` never echoes back a step you passed as `step`, and
  does not fire for the step the wizard mounts on. A restored autosave draft's
  step beats `step`. Autosave records the step over a separate internal
  channel, so driving the wizard from a router never costs a draft its resume
  point.
- `FormRenderer` gained **`stepperOrientation`** — `"horizontal"` (default) or
  `"vertical"`, a left rail from the tablet breakpoint up that stacks below
  it. The list markup, its accessible name, `aria-current="step"` and the
  focus move on step change are identical in both. Exported type
  `StepperOrientation` (`index.ts` only).
- `FormRenderer` gained **`onDraftRestore(info)`**, called once each time
  autosave restores a draft into the form, after the values are applied;
  `info.step` is the step that draft recorded, if any. Exported type
  `DraftRestoreInfo` (`index.ts` only).
- New **`FileDropzone`** (`index.ts` only) — a drag-and-drop surface wrapping a
  real `<input type="file">`, so the platform picker still opens from the
  keyboard with no invented ARIA and no mouse-only capability. The built-in
  `file` field now uses it and shows a per-file accepted/rejected status,
  with a reason on each rejected file.

## [0.1.4] - 2026-07-20

### Fixed

- **`parseSubmission` failed every submission containing a `file` (or
  custom-registered) field nested inside a `group` row.** The schema-
  exclusion pass for `file`/custom-type fields walked only the top-level
  field list, so a nested `file`/custom field was left in the generated zod
  schema, which then rejected the raw (non-`File`) wire value with
  `validation_failed` — even though the identical field at the top level was
  correctly excluded and passed through. The nested field's name also never
  appeared in `unvalidated`, so a host had no way to know the value was
  intentionally unvalidated rather than silently dropped. Both the schema
  exclusion and the `unvalidated` reporting/pass-through now recurse into
  every `group` row at any nesting depth, mirroring the existing group-
  nested `hidden`-field handling; a group-nested file or custom field is now
  reported in `unvalidated` under a dotted, index-less path
  (`"items.receipt"`, `"outer.inner.receipt"`). No config change is
  required to receive the fix. This is a correctness/over-rejection bug,
  not a security issue — nested file/custom values were never trusted
  incorrectly, they were simply unreachable and rejected the entire
  submission.

## [0.1.3] - 2026-07-19

### Security

- **HIGH — `parseSubmission` trusted a submitted value for a `hidden` field
  nested inside a `group` row.** `hidden` is the documented mechanism for a
  server-owned value (a per-line-item price, SKU, or owner id), but the
  re-injection and post-parse re-assertion steps walked only the top-level
  field list, never descending into `group.fields` — so a per-row `hidden`
  value arrived from the request body and was returned unchanged in the
  `ok: true` result instead of the config-authored value. **Top-level
  `hidden` fields were never affected.** Both steps now recurse into every
  `group` row at any nesting depth. No config change is required to receive
  the fix; if your form uses `hidden` fields inside a `group`, upgrade.
- **MEDIUM — a deeply nested request body could crash the handler.** The
  `maxStringLength` walk recursed body-controlled structure without a depth
  bound, so a body nested tens of thousands of levels deep threw an uncaught
  `RangeError` out of `parseSubmission` rather than returning `ok: false` —
  turning the size check itself into the failure. Bounded by a fixed,
  non-configurable structural depth cap (32), routed through the existing
  `input_too_large` result. Throwing remains reserved for a malformed
  *config*, never a malformed body.

### Fixed

- Config-authored `hidden` values were aliased into results **by reference**,
  so a host mutating a returned value (e.g. `result.values.items[0].meta`)
  corrupted the in-memory config for every later request in that process.
  Values are now defensively cloned via `structuredClone`, falling back to
  the original reference for the rare non-cloneable value (`HiddenField`'s
  `value` is typed `unknown`) rather than throwing on the submission path.

### Changed

- `parseSubmission` now owns **two** size limits, not one: the configurable
  `opts.maxStringLength` (content bound, default 10,000) and the fixed
  structural depth cap above. The depth cap is self-protection for the size
  check — request body size and rate limiting remain the host's job.

## [0.1.2] - 2026-07-19

### Added

- **`parseSubmission(config, rawBody, opts?)`** — the engine's first
  server-side trust boundary. Pure, synchronous, reuses the exact schema
  builder (`buildFieldsSchema`, via the shared `buildResolverSchema` seam)
  the client's condition-aware resolver uses.
  Scrubs `__proto__`/`constructor`/`prototype` keys (top-level and inside
  every `group` row) before anything else runs; seeds config-authored
  default values (`buildDefaultValues`, moved to `core/defaults.ts` so both
  the client hook and this function share one table) so an omitted-from-
  the-wire optional field resolves identically to the client's RHF default
  — not `undefined` — before visibility AND the form-level `superRefine`
  (cross-field rules, `optionsFrom` branch membership) are evaluated;
  re-injects top-level `hidden` field values from config on top of that (the
  body can never override a top-level `hidden` value); computes the visible
  field set the same way the client does (`visibleFieldsFor` — field *and*
  step `visibleWhen`); omits `file` fields from schema validation (naming
  them, and fields of a custom registered type, in the returned `unvalidated`
  array) while still passing a submitted file value's raw payload through in
  `values` unvalidated, same as a custom field's value; enforces
  `maxStringLength` (default 10,000, recursive into group rows) against the
  untrusted wire body only — before any regex-bearing `rules.pattern` refine
  runs; fails closed with `code: "otp_checker_missing"` when a visible `otp`
  field exists and `opts.otpVerified` was not supplied — no bypass flag;
  rejects an `otp` field nested inside a `group`, at any depth, with
  `code: "otp_in_group"`, unconditionally; and re-asserts top-level `hidden`
  field values in the `ok: true` output. Every *non-`validation_failed`*
  failure branch returns the same generic `formError` copy regardless of
  cause —
  `code` is for server-side logging only, never disclosed as a
  client-visible signal (`validation_failed` returns per-field messages by
  design, and `otp_checker_missing`'s `fieldErrors` entry stays actionable
  for the same reason). Throws (does not return `ok: false`) if `config`
  itself is malformed, since `validateFormConfig` always runs and a broken
  config is an authoring error, not user input. `opts.messages` accepts a
  `Partial<Messages>` (merged over `defaultMessages`, same as the client's
  `useDynamicForm({ messages })`), not a complete `Messages`.
- *Internal extraction — not part of the public surface, no semver
  obligation:* `core/validation.ts` gained `buildFormSchema(config, messages,
  otpVerified?)` (the raw zod schema for a config's full field list, used by
  `useDynamicForm`) and `buildResolverSchema(config, messages, otpVerified,
  values)` (the exact visibility-then-schema step the client's resolver
  runs for a given `values` snapshot — the shared seam `parseSubmission`'s
  parity tests use too). Neither is re-exported from `index.ts`/
  `headless.ts`; `buildFormSchema` was deliberately kept unexported (see
  ADR-0004 — adding a barrel export later is a free minor bump, removing one
  is a breaking major, so the reversible default wins). Both skip every
  trust-boundary step `parseSubmission` applies (scrubbing, default seeding,
  hidden re-injection, otp fail-closed, size capping); `parseSubmission` is
  the public entry point for handling an actual request body.
- **`buildDefaultValues(fields)`** — moved from `hooks/useDynamicForm.ts` to
  `core/defaults.ts` (pure, sync, React-free); re-exported from the same
  public names (`index.ts`, `headless.ts`) as before, no surface change.
- `ParseSubmissionErrorCode`, `ParseSubmissionOptions`,
  `ParseSubmissionResult` types.

See `docs/adr/0004-server-side-submission-validation.md` for the pinned
design rulings (sync-not-async, fail-closed otp with no opt-out, files
always omitted, disclosure via `unvalidated` instead of a fail-closed
custom-type gate, one size limit instead of three) and
`/docs/server-validation` on the docs site for Route Handler / Server
Action / Express recipes and the secure two-phase otp pattern.

## [0.1.0] - 2026-07-18

Initial packaged surface of the headless engine — the `core`/`hooks`
layer of `form-builder/`, published standalone per ADR-0003 Unit A. Built
with `tsup` to ESM (primary) + CJS (compat) + `.d.ts` from a single dedicated
entry (`form-builder/headless.ts`), verified free of any shadcn/Tailwind/
rendering-layer coupling (`core/boundary.test.ts` at the source level;
`scripts/check-bundle-size.mjs` greps the built output).

### Added

- **Config types** — `FormConfig`, `FieldConfig`, `BaseField`,
  `CustomFieldConfig`, `AnyFieldConfig`, `FieldType`, `Condition`,
  `ConditionSpec`, `Option`, `TextRules`, `PasswordComplexity`,
  `ButtonVariant`, `FieldWidth`, `ResponsiveFieldWidth`, `StepConfig`,
  `FormValues`, plus `BUILT_IN_FIELD_TYPES` and the `isBuiltInField` guard.
- **Validation** — `validateFormConfig` (dev + production config-shape
  validation; runs unconditionally, configs may be CMS-sourced) and
  `OtpVerifiedChecker`.
- **Zod schema / messages** — `defaultMessages` and the `Messages` type for
  host-supplied i18n of built-in validation copy.
- **Field registry** — `registerField`, `getRegisteredTypes`,
  `FieldComponentProps`. Anchored to `globalThis`/`Symbol.for` (see
  `core/registry.ts`) so registrations survive dual ESM/CJS resolution or
  version skew in a consumer's module graph — a published-package
  correctness requirement a copy-in tree never had to solve.
- **Conditions engine** — `conditionMatches`, `conditionSpecMatches`,
  `conditionFieldNames`, `toConditionGroups`, `fromConditionGroups`,
  `evaluateCondition`, `stripInvisibleValues`, `visibleFieldsFor`,
  `hiddenStepFieldNames`, `IsFieldValid`.
- **Form runtime hook** — `useDynamicForm`, `buildDefaultValues`,
  `FormDraft`; `clearDraft` and `AutosaveOptions` for the autosave/draft
  lifecycle.
- **OTP flow** — `useOtpFlow`, `OtpFlowConfig`, `OtpFlowStatus`,
  `useOtpController`, `OtpController`, `OtpFieldHandlers`,
  `UseOtpControllerOptions`, plus the `FormLocale`/`OtpRuntime` types a host
  needs to type its own controller wiring (re-exported type-only — no
  runtime code from the rendering module they're declared alongside reaches
  the built output).
- **Server-side error mapping** — `applyServerErrors`, `ServerErrorResult`,
  `AppliedServerErrors`, for mapping a backend's field-level error response
  onto RHF form state.
- **Masked-value helpers** — `formatMasked`, `extractRaw`, `maskTokenCount`,
  so a headless host can re-format a masked field's raw stored value for
  display (review screens, emails) with the same logic the field itself
  uses.
- **Review-value formatting** — `formatReviewValue`, `ReviewFormatter`,
  `ReviewFormatters`, for headless hosts building their own review/
  confirmation UI.
- **Optional theme sheet** — `./theme.css` subpath export (`theme/tokens.css`)
  — the default `--fb-space-*` token values a host can import as a starting
  point, or ignore entirely (every token has an inline fallback).
- Peer dependencies: `react`, `react-dom`, `react-hook-form`, `zod`,
  `date-fns`, `lucide-react` (shared-instance-critical or heavy enough the
  host almost certainly already has a copy). Bundled dependencies:
  `@hookform/resolvers`, `zustand`, `libphonenumber-js`,
  `react-phone-number-input`, `react-day-picker`, `input-otp`,
  `signature_pad`, `cmdk`, `class-variance-authority`, `clsx`,
  `tailwind-merge`, `radix-ui` (leaf libraries, no shared-instance hazard).

### Not included (by design)

- The rendered UI layer (`FormRenderer`, `FormStepper`, `FieldWrapper`, the
  19 built-in field components) — stays copy-in/registry distribution, not
  published to npm. See ADR-0003 "Why the rendered React entries are not
  npm-exported in Phase 1."
- `./react` and `./fields` subpath exports — deliberately absent, not
  reserved as an empty placeholder (a reserved-but-broken entry was cut in
  review as a footgun).

[Unreleased]: https://github.com/YoussefNesafe/form-builder/compare/cli-v0.2.0...HEAD
[0.2.0]: https://github.com/YoussefNesafe/form-builder/compare/cli-v0.1.6...cli-v0.2.0
[0.1.4]: https://github.com/YoussefNesafe/form-builder/compare/engine-v0.1.3...engine-v0.1.4
[0.1.3]: https://github.com/YoussefNesafe/form-builder/compare/engine-v0.1.2...engine-v0.1.3
[0.1.2]: https://github.com/YoussefNesafe/form-builder/compare/engine-v0.1.0...engine-v0.1.2
[0.1.0]: https://github.com/YoussefNesafe/form-builder/releases/tag/engine-v0.1.0
