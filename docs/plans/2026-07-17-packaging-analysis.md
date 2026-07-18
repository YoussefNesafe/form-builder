# Packaging the Form Builder as a Distributable — Analysis & Recommendations

_Date: 2026-07-17 · Status: analysis + Phases 0–3 IMPLEMENTED (updated 2026-07-18)_

> **Implementation status (2026-07-18).** Phases 0–3 built on branch `feat/packaging-phase-0`
> (commits `185ea76` → `07386e5`); Phase 4 deliberately deferred (demand-gated). The analysis
> below is the original plan; sections that reality diverged from carry an **→ IMPLEMENTED AS**
> note. Load-bearing deviations: the npm package exports the **headless entry only** (rendered
> `./react`/`./fields` were cut — bundling drops `"use client"` + can't resolve `@/components/ui/*`);
> Unit B copy-in ships the **whole `form-builder/` tree self-contained** ("Option A"), not a
> rendered-only layer over an npm engine dep; changesets were **skipped** for a tag-triggered
> release. Authoritative current record = **ADR-0003** + the per-phase notes here. Companion docs:
> `2026-07-18-packaging-phase2-install-guide.md` (consumer), `2026-07-18-packaging-publish-runbook.md`
> (owner).
>
> | Phase | Commit | State |
> |---|---|---|
> | 0 — Decouple in place | `185ea76` | Done — vendored `cn`, `validateFormConfig` → barrel, boundary-guard test |
> | 1 — Headless npm engine | `0aa1c39` | Done — tsup headless build, `globalThis` registry, exact-match alias fix |
> | 2 — Copy-in registry | `57cc786` | Done — 39-item shadcn registry generator + `add` wrapper (Option A) |
> | 3 — Publish & harden | `07386e5` | Done (infra) — inert tag-gated release workflow, CI bundle budget, CHANGELOG. **Real publish is owner-gated, NOT executed.** |
> | 4 — Precompiled-CSS bundle | — | Deferred (demand-gated) |

## TL;DR

The engine is already cleanly layered and nearly framework-agnostic. It has **no Next.js
runtime coupling, no CMS/env coupling, no app-internal imports** — the *only* things tying it
to this repo are (1) 15 shadcn `@/components/ui/*` primitives, (2) the `cn` helper from
`@/lib/utils`, (3) two custom Tailwind breakpoints (`tablet`/`desktop`), and (4) a set of npm
libraries.

The single most important decision: **the visual styling is Tailwind utility-class strings +
host-owned shadcn primitives, not compiled CSS.** That points away from one monolithic bundled
npm package and toward a **split**: publish the headless engine (`core` + `hooks` + `store`) as
a real tree-shakeable npm package, and distribute the rendered field/UI layer **copy-in**
(shadcn-registry style, already the project's stated model).

---

## 1. Current State Analysis

### 1.1 Architecture (already well-factored)

Layered `core → hooks/store → ui → components → fields`, with `index.ts` as the single public
barrel. ~72 files, 7 subdirs:

| Layer | Contents | shadcn/Tailwind coupled? |
|---|---|---|
| `core/` | types, `schema` (validateFormConfig), `validation` (zod builders), `conditions`, `registry`, `messages`, `password`, `autosave`, `serverErrors` | **No** — pure TS, deps: zod, libphonenumber-js |
| `hooks/` | `useDynamicForm`, `useSourceSync`, `useOtpFlow`, `useOtpController` | **No** — deps: RHF, zod resolver |
| `store/` | `createStepperStore` (zustand vanilla) | **No** — deps: zustand |
| `ui/` | `FieldWrapper`, `RequiredMark`, `variants` (cva), `layout` (FLAT_GRID_CLASS) | **Yes** — cn + shadcn `field` |
| `components/` | `FormRenderer`, `FieldRuntime`, `renderField`, `FormStepper`, `ReviewStep`, `FormSection` | **Partial** — Stepper/Review/Wrapper pull shadcn |
| `fields/` | 19 field components + `registerBuiltInFields()` + helpers | **Yes** — bulk of shadcn imports |
| `theme/` | `tokens.css` (optional `--fb-space-*` override scale) | CSS only |

**Key insight:** coupling is entirely confined to the *rendering* layers (`ui`, `components`,
`fields`). `core` + `hooks` + `store` are already a clean, shadcn-free, framework-agnostic
headless form engine.

### 1.2 Coupling with the host app — exact severance list

Only two alias roots escape the package:

- **`@/lib/utils` (`cn`)** — 10 files. Trivial: 3-line `twMerge(clsx(...))`.
- **`@/components/ui/*`** — 15 distinct shadcn modules: `button, input, textarea, field,
  command, popover, calendar, checkbox, switch, label, radio-group, select, slider, input-otp,
  separator`. Transitive closure (their own cross-imports) adds `dialog` + `input-group` →
  **17 primitive files** must travel with the rendered layer. Unused/droppable: `alert`,
  `progress`, `segmented-control`.

No imports of `@/locales/*`, `components/builder`, or any other app alias. i18n already
decoupled: `FieldRuntime` supplies `messages` via React context with a `defaultMessages`
fallback; `FormLocale` carries `date-fns` locale + `countryLabels`. Host injects locale.

### 1.3 Host-environment assumptions

1. **Tailwind v4, CSS-first config** (no `tailwind.config.js`). Consumer imports `tailwindcss`,
   `tw-animate-css`, `shadcn/tailwind.css`.
2. **Two custom breakpoints must exist**: `--breakpoint-tablet: 481px`,
   `--breakpoint-desktop: 1025px`. Every field uses `tablet:`/`desktop:` variants — missing →
   responsive classes silently no-op.
3. **shadcn design tokens** (`--background`, `--foreground`, `--primary`, `--border`,
   `--destructive`, `--ring`, radius scale, plus additive `--accent-brand*`) as OKLCH in
   `:root`/`.dark`. The `* { @apply border-border }` base rule is load-bearing.
4. **Browser-only**: `window.localStorage` for autosave drafts; client components. No SSR of
   form state.
5. Registry is a **module-level singleton `Map`** (§1.4).

### 1.4 Registry = module-level mutable singleton (sharp hazard)

`core/registry.ts` = single `Map` created at module load; `registerField` mutates,
`getField` reads at render. `registerBuiltInFields()` = 24 idempotent `registerField` calls.
Host calls once at module scope.

Works **only while exactly one instance of `core/registry` exists in the module graph.**
Copy-in guarantees that. In a published npm package, version skew or dual ESM/CJS resolution
can create two Maps → registrations land in one, `getField` reads the other → "field type not
registered" at render. **Published package must anchor the registry to `globalThis`** (or
enforce single-instance via peer-dep dedupe).

### 1.5 Current distribution model

Already **copy-in, shadcn-style** (README: "The engine is copy-in, not an npm package — same
model as shadcn/ui"). `scripts/zip-form-builder.mjs` mirrors the whole `form-builder/` folder
verbatim (raw `.ts/.tsx`, **including tests**, no build step) into `public/form-builder.zip`
for a docs "Download" button. In-app `components/docs/installation/*` teaches the copy-in flow.

---

## 2. Dependencies & Packaging Requirements

### 2.1 Full runtime dependency inventory

| Dependency | Used by | Recommendation |
|---|---|---|
| `react`, `react-dom` | everywhere | **peer** (`>=19`) |
| `react-hook-form` | hooks, components | **peer** (host may share the form instance) |
| `zod` | core validation/schema | **peer** (v4; host likely validates too) |
| `@hookform/resolvers` | useDynamicForm | **dependency** (bundle) |
| `zustand` | stepper store | **dependency** |
| `date-fns` | DateField, FormLocale | **peer** (large, commonly shared) or dependency |
| `libphonenumber-js` | PhoneField, schema | **dependency** |
| `react-phone-number-input` | PhoneField | **dependency** (+ `/flags`) |
| `react-day-picker` | DateField/Calendar | **dependency** |
| `input-otp` | OtpField | **dependency** |
| `signature_pad` | SignatureField | **dependency** |
| `cmdk` | command primitive | **dependency** |
| `lucide-react` | icons across fields | **peer** (host icon set) or dependency |
| `class-variance-authority`, `clsx`, `tailwind-merge` | variants + cn | **dependency** |
| `radix-ui` (unified pkg) | shadcn primitives | **peer/dependency** — travels with copy-in UI |

**Rule of thumb:** things the host almost certainly already has and where a duplicate instance
is harmful (React, RHF, zod) → **peer**. Leaf libraries specific to one field → **bundled
dependency**. Heavy commonly-shared libs (date-fns, lucide) → **peer with documented range**.

### 2.2 What must be extracted / vendored

- **`cn`** — vendor into the package (`internal/cn.ts`), drop `@/lib/utils`. 3 lines.
- **shadcn primitives** — the crux. Host-owned and themeable by design. Either vendor a copy
  into the distributed UI layer, or declare them a prerequisite installed via shadcn CLI. See §5.

### 2.3 Tailwind coupling (hard requirement, not a JS dep)

Package ships **class strings, not CSS**. Consumer needs: Tailwind v4, the `tablet`/`desktop`
breakpoints, the shadcn token set, `tw-animate-css`, `shadcn/tailwind.css`. This is why a "just
`npm install` and go, zero setup" experience is **not achievable** for the rendered layer
without precompiling CSS (which kills shadcn themeability).

---

## 3. Component & Feature Export Strategy

### 3.1 Current public surface (good, one gap)

`index.ts` already exposes a curated API: config types, `FormRenderer`/`FormSection`,
`registerField`/`registerBuiltInFields`, all hooks, conditions API, autosave (`clearDraft`),
`applyServerErrors`, value helpers. Custom-field authors get `FieldWrapper`,
`fieldAriaDescribedBy`, `useFieldRuntime`, `useFieldDisabled`.

**Gap:** `validateFormConfig` (from `core/schema`) is consumed by app production code
(`builder/model/useSerializedConfig.ts`) and many tests but is **not in the barrel**. Promote
before any extraction.

### 3.2 Recommended export structure — subpath exports

Originally proposed (aspirational):

```
@yourscope/form-engine            → headless: types, schema, validation, conditions, registry, hooks, store, messages
@yourscope/form-engine/react      → FormRenderer, FieldRuntime, renderField, FieldWrapper (rendering runtime, no field bodies)
@yourscope/form-engine/fields     → registerBuiltInFields + individual field components
@yourscope/form-engine/fields/PhoneField   → individual field (deep-importable for scoped registration)
@yourscope/form-engine/theme.css  → optional tokens.css
```

**→ IMPLEMENTED AS (Phase 1):** the npm package exports the **headless entry only** —
`.` → `dist/headless.*` (a dedicated `form-builder/headless.ts` re-export of the shadcn-free
surface) plus `./theme.css`. The `./react`/`./fields` subpaths were **cut in review**: tsup
bundling drops the per-file `"use client"` directives (breaks Next RSC) and leaves
`@/components/ui/*` as an unresolvable external. The rendered layer therefore does not ship via
npm at all — it goes copy-in through the Phase 2 registry (see §5.1). `"sideEffects"` is
`["**/*.css"]`, not `false`. Scoped-registration for the rendered layer is a copy-in concern,
not an npm subpath concern.

### 3.3 How consumers use each piece

- **Core engine** → `import { validateFormConfig, buildFormSchema, useDynamicForm } from
  "@yourscope/form-engine"` — any React app, no Tailwind, no shadcn.
- **Full renderer** → `import { FormRenderer } from "@yourscope/form-engine/react"` +
  `registerBuiltInFields()` once.
- **Custom fields** → `import { registerField, FieldWrapper, useFieldRuntime }`; author to
  `FieldComponentProps`, register by type string.
- **Validation only** (server-side submit re-check) → `buildFormSchema` from headless entry;
  zod parse. No React.

---

## 4. Configuration & Integration

Engine is already config-driven and injection-based:

- **Form schema** → JSON-serializable `FormConfig` (patterns are strings not RegExp, dates are
  `yyyy-MM-dd` strings — CMS-safe). Passed as prop to `FormRenderer`.
- **Custom fields** → `registerField(type, Component)`; values pass through as
  `z.unknown().optional()`. Zero core changes to extend.
- **Validation rules** → declared in config; cross-field rules in a form-level superRefine.
  Host can also consume `buildFormSchema` directly.
- **Themes/styles** → shadcn tokens + optional `--fb-space-*` override scale (redefine a CSS
  var to retheme a step; undefined → literal fallback renders).
- **Callbacks/events** → `onSubmit`, OTP controller (`useOtpController`), `applyServerErrors`,
  autosave options. All host-supplied.

**Framework-agnostic changes needed:** essentially none at engine level. No Next imports (one
cosmetic `next/next/no-img-element` eslint comment). De-Next-ing is documentation only.

---

## 5. Build & Distribution Strategy

### 5.1 Core recommendation: split into two distribution units

**Unit A — Headless engine as a real npm package** (`core` + `hooks` + `store` + types +
messages):
- Genuinely publishable: zero shadcn/Tailwind coupling, small dep set.
- **Build:** `tsup` → **ESM primary, CJS optional**, with `.d.ts` declarations.
- `"type": "module"`, `"sideEffects": false`, `exports` map with subpaths, `types` per entry.
- Tree-shakeable; works in any React project (Next, Vite, Remix, CRA).
- **Registry fix:** anchor singleton to `globalThis`.

**Unit B — Rendered UI layer as a shadcn-style registry / CLI** (`ui` + `components` + `fields`
+ 17 shadcn primitives):
- Distributed **copy-in** via a shadcn registry JSON + `npx` add command (modern evolution of
  the current zip). Files land in the consumer repo, Tailwind-configured and editable.
- Keeps themeability; avoids shipping brittle precompiled CSS.
- ~~CLI installs the headless package (Unit A) as a dependency and copies the visual files.~~

**→ IMPLEMENTED AS (Phase 2, "Option A" — architect ruling, ADR-0003):** the copy-in ships the
**entire `form-builder/` tree — headless + rendered — self-contained**, NOT rendered-only over
an npm engine dep. The rendered fields relative-import `../core/*`/`../hooks/*`, so the engine
source travels with the copy; Unit A's npm package is a **separate door** for headless-only
consumers. The Phase-1 `globalThis` registry anchor is what makes running both doors in one app
safe. Two verified registry constraints shaped the generator: (1) shadcn resolves bare
`registryDependencies` against its *public* registry even for locally-passed items (and rejects
`file://`), so **our `scripts/form-builder-add.mjs` wrapper owns the transitive graph** and calls
`shadcn add` once with explicit relative `./` paths; (2) the 17 primitives are **vendored** into
our registry (not pulled from shadcn's public one) because they're customized
(`radix-nova`/`rtl:true`). Generator = `scripts/build-registry.mjs` → 39 items (1 `form-engine`
base + 17 `fb-ui-*` + 19 `field-*` + `form-builder` aggregate + `fb-theme`), compiled by
`shadcn build`; `registry:theme` cssVars auto-inject the breakpoints into `@theme`.

Matches the project's existing shadcn-copy-in philosophy while upgrading "download a zip" to a
real registry/CLI, and carves out the part that genuinely benefits from npm semver +
tree-shaking.

### 5.2 Why not one bundled npm package with compiled CSS

Either (a) ship precompiled CSS — losing shadcn token theming and forcing visual choices on
consumers, or (b) ship Tailwind classes that only render if the consumer reproduces the
breakpoints + tokens — copy-in's coupling *without* copy-in's editability. Offer only as an
optional "batteries-included" variant if demand exists; not the primary path.

### 5.3 Output formats & tooling summary

- **Bundler:** tsup for the engine; a small Node script (evolve `zip-form-builder.mjs`) to emit
  the registry manifest for the UI layer.
- **Formats:** ESM (primary) + CJS (compat). Preserve modules for tree-shaking; no single-file
  bundle for the fields entry.
- **Types:** emit `.d.ts`; `FormConfig` etc. is the authoring contract.
- **CSS:** ship `theme/tokens.css` as optional import; document required Tailwind setup rather
  than bundling.
- **Versioning:** semver + Conventional Commits + changesets. Treat `FormConfig`'s shape
  (`core/types.ts`) as the compatibility contract.
  **→ IMPLEMENTED AS (Phase 3):** changesets **skipped** — root is `private:true` with no yarn
  workspace, and converting the app to a workspace for one publishable package wasn't worth the
  churn. Replaced with a **tag-triggered release** (`.github/workflows/release.yml`, `engine-v*`)
  + hand-maintained `form-builder/CHANGELOG.md`. `FormConfig` (`core/types.ts`), the field-registry
  surface, and the barrel `exports` map are the three semver contract surfaces (see the publish
  runbook). tsup emits ESM **and** CJS + `.d.ts`.

---

## 6. Documentation Requirements

Must cover:

1. **Install** — headless: `npm i @yourscope/form-engine`; UI: `npx @yourscope/form-engine add`
   (+ prerequisite: shadcn init, Tailwind v4, the two breakpoints, token block).
2. **Configure** — `FormConfig` reference (field types, `rules`, conditions, steps, widths),
   with JSON-serializable guarantees (CMS-sourced configs).
3. **Create forms** — minimal `FormRenderer` + `registerBuiltInFields()`; multi-step; OTP via
   `useOtpController`; autosave; server errors.
4. **Extend** — authoring a custom field against `FieldComponentProps` + `FieldWrapper`/
   `useFieldRuntime`; registering; scoped registration for bundle size.
5. **Theme/i18n** — token override scale, `messages`/`FormLocale` injection, RTL.
6. **Troubleshoot** — top failures: "field type not registered" (missing
   `registerBuiltInFields`/dual registry instance), `tablet:`/`desktop:` classes not applying
   (missing breakpoints), unstyled borders (missing `border-border` base rule), tree-shaking
   (use subpath imports).

Record an **ADR** for the split-distribution decision (`docs/adr/` convention exists; none
covers packaging yet). **→ DONE:** `docs/adr/0003-packaging-split-distribution.md` (Accepted;
revised post-spike to Option A). Consumer install steps live in
`2026-07-18-packaging-phase2-install-guide.md`; owner publish steps in
`2026-07-18-packaging-publish-runbook.md`. The live-docs cutover (`components/docs/installation/*`
+ README) is deferred until first publish + registry hosting.

---

## 7. Migration Plan (phased, no big-bang)

**Phase 0 — De-couple in place (no distribution yet). ✅ DONE `185ea76`.**
Vendored `cn`; promoted `validateFormConfig` into the barrel; added a boundary-guard test.
Everything still builds inside this repo. *Deviation:* `globalThis` registry anchoring and
`sideEffects` groundwork were moved to Phase 1 (staff YAGNI — those hazards only exist once
published; the registry API already encapsulates the Map, so deferring was free).

**Phase 1 — Carve the headless engine. ✅ DONE `0aa1c39`.**
Added `form-builder/package.json` + tsup build (`dist/headless.*`, ESM+CJS+`.d.ts`); anchored the
registry to `globalThis` (`Symbol.for("form-builder.fieldRegistry.v1")`). App keeps consuming
live source via an **exact-match `@/form-builder` alias** added ahead of the `@/*` wildcard in
tsconfig + vitest (the nested package.json's `exports` was hijacking the app's own resolution →
`dist`, dropping `"use client"`). *Deviation:* exports are **headless-only**, not the full subpath
set (see §3.2).

**Phase 2 — Registry/CLI for the UI layer. ✅ DONE `57cc786`.**
`zip-form-builder.mjs` kept (transitional); added `scripts/build-registry.mjs` (39-item shadcn
registry from the real import graph) + `scripts/form-builder-add.mjs` (the "CLI" wrapper).
*Deviation:* "Option A" — copy-in ships the **whole tree self-contained**, NOT "install engine
dep" (see §5.1). Dogfooded via a local `shadcn add` smoke test into a temp consumer.

**Phase 3 — Publish & harden. ✅ DONE (infra) `07386e5`. Real publish OWNER-GATED, not executed.**
Added `release.yml` (tag `engine-v*`/dispatch-only, triple-gated inert no-op, `environment:
release` approval + `--provenance`), CI bundle-size budget (`scripts/check-bundle-size.mjs`, gzip
+ sourcemap coupling check), `form-builder/CHANGELOG.md`. *Deviations:* changesets skipped (§5.3);
the docs "Download → CLI" cutover is **deferred to post-publish** (wiring live docs to an
unpublished/unhosted registry would mislead visitors). Owner steps to actually publish:
`2026-07-18-packaging-publish-runbook.md`.

**Phase 4 — Optional convenience bundle. ⏸ DEFERRED (demand-gated).**
A batteries-included precompiled-CSS variant, marked non-themeable — built only if demand
emerges. Not built (building it speculatively trades away the themeability that is the product's
value prop).

---

## 8. Risks & Technical Considerations

| Risk | Impact | Mitigation |
|---|---|---|
| **Dual registry instance** (npm) | Runtime "field not registered" | Anchor `Map` to `globalThis`; dedupe peer deps |
| **Tailwind config coupling** | Missing breakpoints/tokens → broken layout | Ship preset/CSS snippet; CLI writes breakpoints; loud docs |
| **shadcn primitives host-owned** | Can't cleanly bundle without losing themeability | Copy-in/registry for UI layer, not npm-bundle |
| **`validateFormConfig` non-public** but app-used | Extraction breaks builder | Promote to barrel in Phase 0 |
| **No `sideEffects: false`** today | Barrel drags all 24 fields into bundle | Subpath exports + sideEffects flag |
| **peer vs bundled misjudgment** (React/RHF/zod duplicated) | Broken hooks/context, two zod instances | Make React, RHF, zod peers with ranges |
| **RHF/zod version drift** in consumer | Resolver/refine breakage | Pin peer ranges; document tested versions |
| **Raw-source zip ships tests** | Confusing/heavy for consumers | Registry manifest excludes `*.test.*`; ship built engine, copy-in source |
| **Config = compatibility contract** | `FormConfig` changes break CMS-stored configs | Treat `core/types.ts` as semver-governed |

---

## Appendix: Evidence base

- Package: `form-builder/form-builder/` — 7 subdirs, `index.ts` barrel.
- External imports out of package: only `@/components/ui/*` (15 modules, 17 w/ transitive) and
  `@/lib/utils` (`cn`, 10 files). No Next runtime, no CMS/env, no other `@/` alias.
- shadcn config: `components.json` `"style": "radix-nova"`, `"rtl": true`, unified `radix-ui`
  package (not `@radix-ui/react-*`).
- Global CSS: `app/globals.css` — Tailwind v4 CSS-first, `@import "shadcn/tailwind.css"` +
  `tw-animate-css`, breakpoints `--breakpoint-tablet: 481px` / `--breakpoint-desktop: 1025px`,
  OKLCH token set, `* { @apply border-border }` base rule.
- Registry: `core/registry.ts` module-level `Map` singleton; `registerBuiltInFields()` = 24
  idempotent registrations.
- Distribution today: `scripts/zip-form-builder.mjs` → `public/form-builder.zip`, verbatim
  folder mirror incl. tests, no build.
