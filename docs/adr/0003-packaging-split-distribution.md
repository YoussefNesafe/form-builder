# ADR-0003: Split packaging — headless engine as npm, rendered UI as copy-in

<!-- File naming: adr-0001-use-postgres.md — zero-padded, kebab-case. -->
<!-- One ADR per decision. Keep it short; link out for detail. -->

- **Status:** Accepted
- **Date:** 2026-07-18 (Unit B mechanism revised post-spike; originally 2026-07-17)
- **Deciders:** architect, staff-engineer, documentation-engineer (recorded)
- **Tags:** packaging, distribution, frontend, architecture

## Context

`form-builder/` has shipped since v1 as a copy-in folder (README: "the engine is
copy-in, not an npm package — same model as shadcn/ui"), mirrored verbatim
(including tests, no build step) into `public/form-builder.zip` by
`scripts/zip-form-builder.mjs` for the docs "Download" button. As the package
matured toward being a real distributable, the team needed a considered answer
to "does this become an npm package?" rather than an ad hoc one.

A packaging analysis (`docs/plans/2026-07-17-packaging-analysis.md`) audited
the actual coupling. Findings that drove this decision:

- `core` + `hooks` + `store` (types, `schema`, `validation`, `conditions`,
  `registry`, `messages`, `useDynamicForm`, `useOtpFlow`/`useOtpController`,
  the zustand stepper store) are **already shadcn/Tailwind-free** — pure TS
  plus zod, RHF, zustand, libphonenumber-js. Genuinely framework-agnostic.
- `ui` + `components` + `fields` (`FieldWrapper`, `FormRenderer`,
  `FormStepper`, the 19 field components) pull in **17 shadcn primitive
  files** (`@/components/ui/*`, 15 direct + 2 transitive) and are styled with
  **Tailwind utility-class strings, not compiled CSS** — by design, so a host
  can retheme them via shadcn tokens and the package's own `--fb-space-*`
  override scale.
- The package's registry (`core/registry.ts`) was a plain module-level `Map`
  — safe only while exactly one instance of the module exists in the graph,
  which copy-in guarantees but a published npm package does not (version
  skew or dual ESM/CJS resolution can create two Maps, so a registration
  written in one instance is invisible to a `getField` read in the other).
- The app itself had already hit the cost of *not* having subpath exports:
  `FlagshipSignupForm`/`LandingDemoForm` had to hand-roll scoped field
  imports to keep `signature_pad`, `cmdk`, and `react-phone-number-input` out
  of the landing bundle, because the single barrel had no `"sideEffects":
  false` + subpath boundary to do it for them.
- Utility-class strings can't be shipped as compiled CSS without losing
  shadcn's host-owned theming, and Tailwind classes only render correctly if
  the consumer reproduces the two custom breakpoints (`tablet`/`desktop`)
  and the full shadcn token set — a "just `npm install` and go" experience
  is not achievable for the *rendered* layer at all, independent of build
  tooling.

The team needed a packaging strategy that (a) gives the parts that are
genuinely portable real npm ergonomics (tree-shaking, semver, `.d.ts`),
(b) doesn't force compiled CSS or a frozen visual layer onto a project whose
whole pitch is "edit the field components, they're yours," and (c) survives
being loaded twice in one module graph, which only becomes possible once the
code leaves this repo.

**Revision note (2026-07-18).** Phase 2 had not been built when this ADR was
first accepted; a validated spike into the shadcn-registry mechanism since
refined Unit B's distribution model from an earlier draft (rendered-only
copy-in installing `@form-builder/engine` as an npm dependency) to the
self-contained whole-tree copy-in described below, and surfaced two registry
constraints worth recording ahead of the Phase 2 build. The Decision and
Alternatives sections below reflect the ratified model; the rejected draft is
kept as an alternative for the record.

**Revision 2 (2026-07-18) — single-folder self-contained installer.** Per an
owner requirement ("one command, everything in one place, editable, like
shadcn"), Unit B's delivery evolved once more. Instead of copying the tree to
the consumer root and leaving the 17 primitives at the consumer's own
`components/ui/` (reached via `@/components/ui/*`), the installer now lands
**everything under a single `<base>/form-builder/` folder** (`base` =
`src/` → else `app/` → else root), with the primitives vendored inside it at
`form-builder/components/ui/`. A dedicated CLI (`cli/`, `bin: form-builder`)
does a **direct copy + an install-time import-rewrite pass** that turns every
`@/components/ui/*` and `@/lib/utils` import into a relative path, so the
folder has **zero `@/` aliases** and is portable regardless of the consumer's
tsconfig (an output residual-`@/` scan hard-fails the install if any alias is
missed). This supersedes the `shadcn add`-based wrapper: the CLI no longer
shells shadcn at all, and the theme step writes a sentinel-wrapped `@theme`
block **directly into the consumer's `globals.css`** (no `components.json`/
`shadcn init` prerequisite). Re-runs skip existing files by default (protecting
user edits; `--force` overwrites). The repo's `form-builder/**` source stays
alias-based and unchanged — the rewrite is install-time only, on copies. The
`scripts/build-registry.mjs` import-graph model is still the source of truth
for the file/dependency closure; the compiled `public/r` registry remains for a
future hosted-registry path but is not on the CLI's critical path. Trade-off
accepted vs. the prior model: the primitives are duplicated into the folder
rather than shared with the consumer's own shadcn UI, and copied field files
differ from repo source by their rewritten import lines (covered by the
residual scan + install smoke tests).

## Decision

We will **split the package into two distribution units** rather than
publish one bundled npm package.

**Unit A — headless engine, real npm package.** `core` + `hooks` + `store` +
types + `messages` ship as `@form-builder/engine` (scoped name is a
placeholder pending a public name), built with `tsup` to ESM (primary) + CJS
(compat) + `.d.ts`, `"type": "module"`, `"sideEffects": ["**/*.css"]`, and an
`exports` map that in Phase 1 exposes exactly two entries: `.` → the built
headless entry (`dist/headless.*`, a dedicated `form-builder/headless.ts`
re-export of only the shadcn-free surface), and `./theme.css` → the optional
token sheet. This is genuinely publishable: zero shadcn/Tailwind coupling, a
small dependency set, tree-shakeable in any React host (Next, Vite, Remix,
CRA). The full `form-builder/index.ts` barrel (which also re-exports the
rendering layer) stays the app's own source-alias entry and is deliberately
NOT the published entry.

**Unit B — rendered UI layer, copy-in (shadcn-registry style), NOT npm.**
`ui` + `components` + `fields` + the 17 shadcn primitives stay copy-in,
evolving today's zip download into a shadcn-style registry JSON + CLI `add`
command (Phase 2, not yet built; see "Registry mechanics" below for two
constraints a validated spike surfaced). **The copy-in ships the entire
`form-builder/` tree — headless (`core`/`hooks`/`store`) and rendered
(`ui`/`components`/`fields`) together — self-contained.** It does **not**
install `@form-builder/engine` as an npm dependency underneath itself: the
rendered field components relative-import `../core/*` and `../hooks/*`, so
the engine source travels with the copy rather than being resolved through
`node_modules`. Unit A's npm package is a **separate door** — for
headless-only or server-side-validation consumers who never touch the
rendered layer — not something the copy-in depends on. Both doors ship the
same source; the Phase 1 `globalThis`/`Symbol.for` registry anchor (below) is
precisely what makes running both doors in the same app safe, since without
it a host running both could end up with two independent `core/registry`
instances — one from the copied tree, one from
`node_modules/@form-builder/engine` — silently missing each other's
registrations. Files land in the consumer's own repo, already
Tailwind-configured and directly editable. This is the load-bearing reason
for the split: the rendered layer ships Tailwind utility-class strings
against host-owned, themeable shadcn primitives, and neither a bundled JS
package nor precompiled CSS can carry that without collapsing the theming
story down to "pick our colors."

**Registry mechanics (verified by spike).** Two constraints the Phase 2
spike confirmed before the registry/CLI gets built: (a) shadcn's
`registryDependencies` field resolves bare names against shadcn's *public*
registry only — a local `file://` path or same-repo relative reference is
rejected, so cross-item dependencies inside our own registry cannot chain-
resolve on their own. A thin generator/wrapper therefore owns the transitive
dependency graph itself and calls `shadcn add` once with an explicit list of
relative local paths, rather than relying on `registryDependencies` to
resolve them. (b) The 17 shadcn primitives are **vendored into our
registry**, not referenced from shadcn's public registry, because this
repo's `components.json` is customized (`"style": "radix-nova"`, `"rtl":
true`) — pulling `button`/`select`/etc. from the public registry would
silently overwrite that customization with upstream defaults.

**Why the rendered React entries are not npm-exported in Phase 1.** The
`./react` and `./fields` subpaths are deliberately **absent** from the Phase 1
`exports` map (an earlier draft that reserved them as empty shape was cut in
review — advertising an entry that build-breaks in the consumer is a footgun,
not a placeholder). Bundling `ui`/`components`/`fields` with `tsup` today
would (a) drop the per-file `"use client"` directives each field/component
file carries, breaking Next RSC boundaries the moment the bundler concatenates
files, and (b) leave `@/components/ui/*` as an unresolved external the
published package has no way to satisfy, since those primitives are supposed
to remain host-owned and editable, not vendored into a compiled dependency. A
build gate greps the built `dist/headless.*` for `@/components/ui` and
`internal/cn` and fails on any match, so the headless entry cannot silently
regain that coupling. Phase 1 publishes the headless entry only; the rendered
layer stays copy-in until Phase 2 ships the registry/CLI that copies source
directly into the consumer's tree instead of compiling it.

**Registry anchored to `globalThis`.** `core/registry.ts`'s field-component
`Map` is keyed off a versioned `Symbol.for("form-builder.fieldRegistry.v1")`
instead of a bare module-level `const`. `Symbol.for` resolves through the
runtime-wide global symbol registry, so every module instance — including
two different instances loaded via ESM/CJS dual resolution or version skew
— shares the same `Map`. The `v1` suffix reserves room to move to a new key
if the registry's shape ever changes in a breaking way, without colliding
with instances still expecting the old shape.

**Peer vs. bundled dependency split.** `react`, `react-dom`,
`react-hook-form`, `zod`, `date-fns`, and `lucide-react` are **peer**
dependencies: each is shared-instance-critical (a duplicate React or RHF
instance breaks hooks/context; a duplicate zod instance breaks
`instanceof`-style checks used by resolvers) or heavy enough that the host
almost certainly already has a copy the package should reuse rather than
double-ship. `@hookform/resolvers`, `zustand`, `libphonenumber-js`,
`react-phone-number-input`, `react-day-picker`, `input-otp`,
`signature_pad`, `cmdk`, `class-variance-authority`, `clsx`,
`tailwind-merge`, and `radix-ui` are **bundled dependencies**: each is a leaf
library scoped to one field or one internal helper, with no shared-instance
hazard if the host also happens to depend on it separately.

**In-place packaging required a resolution fix.** `form-builder/package.json`
now exists inside the app repo (for Unit A's `exports` map to be real), which
means a bare `@/form-builder` import risks resolving through that
`package.json`'s `exports` field via directory-index resolution — silently
switching the app from live source to stale/absent `dist/` output and losing
per-file `"use client"` boundaries in the process. `tsconfig.json` and
`vitest.config.ts` both add an **exact-match** `"@/form-builder"` /
`{ find: /^@\/form-builder$/ }` entry pointing straight at
`form-builder/index.ts`, checked *before* the general `"@/*"` wildcard. Deep
imports (`@/form-builder/fields/...`) are untouched — they never match the
exact-string pattern and keep resolving through the wildcard as a plain file
resolve, not a directory-index resolve. This keeps the app consuming live
source while Unit A's `package.json` is real enough to build and publish
independently.

## Rollout (phased, no big-bang)

- **Phase 0 — Decouple in place (done, commit `185ea76`).** Vendor `cn` into
  the package, promote `validateFormConfig` into the barrel + repoint its deep
  importers, add a boundary-guard test that fails if `core`/`hooks`/`store`
  import shadcn/`cn`/Tailwind. No distribution yet; everything still builds
  inside this repo.
- **Phase 1 — Carve the headless engine (done).** Anchor the registry to
  `globalThis`; add `form-builder/package.json` + `tsup` build (`dist/headless.*`
  ESM+CJS+`.d.ts`) for Unit A; add the exact-match `@/form-builder` alias fix so
  the app keeps consuming live source via the alias.
- **Phase 2 — Registry/CLI for the UI layer.** Generate a shadcn registry
  (`public/r/*.json` via `shadcn build`) covering the entire `form-builder/`
  tree — headless and rendered together, per the self-contained Unit B model
  above — plus the 17 vendored shadcn primitives and a `registry:theme` item
  that auto-injects the `tablet`/`desktop` breakpoints; script a thin
  add-wrapper that owns the transitive dependency graph and calls
  `shadcn add` once with the resolved local paths (see "Registry mechanics"
  above — local `registryDependencies` don't resolve on their own). Keep
  `zip-form-builder.mjs`/`public/form-builder.zip` as a transitional download
  path until the wrapper ships.
- **Phase 3 — Publish & harden.** Publish the engine under semver +
  changesets; wire the docs "Download" button to the CLI; add a CI
  bundle-size budget to protect tree-shaking.
- **Phase 4 — Optional convenience bundle.** Only if demand emerges: a
  batteries-included, precompiled-CSS variant, explicitly marked
  non-themeable — not the primary distribution path.

## Consequences

### Positive
- The genuinely portable 40% of the package (headless engine) gets real npm
  ergonomics — semver, tree-shaking, `.d.ts`, subpath imports — without
  forcing the other 60% (rendered UI) into a shape it can't survive in.
- Scoped registration (already a workaround the landing page needed) becomes
  a first-class feature of the `exports` map instead of a hand-rolled
  deep-import pattern.
- The rendered layer keeps its actual value proposition — the field
  components are yours to edit once copied in — instead of becoming an
  opaque compiled dependency a host has to fork to restyle.
- The registry fix and the alias fix are both narrow, load-bearing, and
  documented at their point of use, so they won't get "simplified" away by
  someone who doesn't know why they exist.

### Negative
- Two distribution mechanisms (npm + registry/CLI) instead of one means two
  install stories to document and two things that can drift out of sync —
  the copy-in tree and the published `@form-builder/engine` ship the same
  source through two different doors, and a change to `core`/`hooks` has to
  land in both without one lagging the other.
- The rendered layer still requires the consumer to have Tailwind v4, the
  `tablet`/`desktop` breakpoints, and the shadcn token set already in place
  — copy-in solves ownership, not the "zero setup" problem the analysis
  concluded is unreachable for a utility-class-string UI layer.
- The rendered layer has no npm entry at all until Phase 2 — a consumer who
  wants `FormRenderer` and the field components today must copy them in (via
  the current zip; via the registry/CLI once Phase 2 lands). The headless
  package alone is not a drop-in "render my config" install.

### Neutral
- Phase 4's compiled-CSS bundle is deliberately deferred behind demand, not
  rejected outright — it exists as an escape hatch for consumers who want
  zero setup and are willing to trade away theming for it.

## Alternatives considered

- **One bundled npm package with precompiled CSS** — rejected: forces a
  choice between (a) shipping precompiled CSS, which locks in visual choices
  and strips shadcn token theming, or (b) shipping Tailwind classes that only
  render if the consumer independently reproduces the breakpoints and token
  set — copy-in's coupling without copy-in's editability, the worst of both
  models.
- **Bundling `ui`/`components`/`fields` into Unit A's npm build now** —
  rejected for Phase 1: `tsup` bundling drops the per-file `"use client"`
  directives (breaking Next RSC) and leaves `@/components/ui/*` as an
  external the package can't resolve, since those primitives are meant to
  stay host-owned. Revisit only if the rendered layer moves to vendoring its
  own copy of the shadcn primitives, which would itself reopen the
  themeability tradeoff this ADR rejects above.
- **Rendered-layer copy-in that installs `@form-builder/engine` as an npm
  dependency (Option B)** — the originally drafted Unit B model; rejected
  post-spike in favor of the self-contained whole-tree copy-in described in
  Decision → Unit B above. It ships rewritten relative imports (`../core/*`
  becoming a package specifier) that were never exercised inside this repo,
  since the app itself always consumes `core`/`hooks`/`store` as live
  source, never through `node_modules`; it adds a deep-internal version
  coupling between the copied rendered layer and whatever
  `@form-builder/engine` version resolves in the consumer's lockfile, where
  today the two travel together by construction and can't drift; and it
  blocks the copy-in's stated value proposition — a consumer could no longer
  edit `core`/`hooks` alongside `fields` without forking a published
  dependency instead of just editing the file in their own tree.
- **Keeping the status-quo raw zip mirror (including tests) as the permanent
  distribution mechanism** — rejected: no build step, no version boundary,
  and it ships test files to consumers; Phase 2's registry manifest is the
  same "copy source, don't compile it" philosophy with a version-aware
  manifest instead of a folder mirror.
- **Bare module-level `Map` for the registry (status quo)** — rejected once
  publishing to npm is in scope: works only under copy-in's single-instance
  guarantee, which a published package with dual ESM/CJS resolution or
  version skew cannot make. `globalThis` + `Symbol.for` anchoring survives
  that.

## References

- `docs/plans/2026-07-17-packaging-analysis.md` — full analysis (coupling
  audit, dependency inventory, export strategy, phased migration plan, risk
  table)
- `form-builder/package.json`, `form-builder/tsup.config.ts`,
  `form-builder/headless.ts` — the headless-only build entry
- `form-builder/core/registry.ts` — `globalThis`/`Symbol.for` anchoring, with
  inline rationale comment
- `tsconfig.json`, `vitest.config.ts` — exact-match `@/form-builder` alias
  ahead of the `@/*` wildcard
- `scripts/zip-form-builder.mjs` — current copy-in distribution mechanism,
  to be evolved into the Phase 2 registry manifest
- ADR-0001: Typed TS dictionary for site copy, no locale routing
- ADR-0002: `(site)` route group with a single shared shell
