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

_Nothing yet._

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
