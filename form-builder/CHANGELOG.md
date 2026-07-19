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
  re-injects `hidden` field values from config on top of that (the body can
  never override them); computes the visible field set the same way the
  client does (`visibleFieldsFor` — field *and* step `visibleWhen`); omits
  `file` fields from schema validation (naming them, and fields of a custom
  registered type, in the returned `unvalidated` array) while still passing
  a submitted file value's raw payload through in `values` unvalidated,
  same as a custom field's value; enforces `maxStringLength` (default
  10,000, recursive into group rows) against the untrusted wire body only —
  before any regex-bearing `rules.pattern` refine runs; fails closed with
  `code: "otp_checker_missing"` when a visible `otp` field exists and
  `opts.otpVerified` was not supplied — no bypass flag; rejects an `otp`
  field nested inside a `group`, at any depth, with
  `code: "otp_in_group"`, unconditionally; and re-asserts `hidden` field
  values in the `ok: true` output. Every *non-`validation_failed`* failure
  branch returns the same generic `formError` copy regardless of cause —
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

[Unreleased]: https://github.com/YoussefNesafe/form-builder/compare/engine-v0.1.0...HEAD
[0.1.0]: https://github.com/YoussefNesafe/form-builder/releases/tag/engine-v0.1.0
