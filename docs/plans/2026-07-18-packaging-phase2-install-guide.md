# Phase 2 registry install guide (draft — not yet shipped)

_Date: 2026-07-18 · Status: draft, describes unshipped behavior_

This documents the planned Phase 2 consumer install flow — the
shadcn-registry `add` path for Unit B ratified in
[ADR-0003](../adr/0003-packaging-split-distribution.md) (Decision → Unit B,
"Registry mechanics"). **Phase 2 hasn't been built yet** (repo is on
`feat/packaging-phase-0`), and the wrapper command name below is a
placeholder pending the build owner's decision — don't fold this into the
live `components/docs/installation/*` pages or the README until the CLI
ships and the command name is final. Until then, the shipped install flow is
still the one those pages already describe (copy the `form-builder/` folder
or download the zip, `npx shadcn@latest add ...` the 17 primitives by hand,
paste the CSS block, install peer deps, call `registerBuiltInFields()`).

Read this alongside `docs/plans/2026-07-17-packaging-analysis.md` §5.1/§6/§7
for the full rationale.

## 1. Prerequisites — before running any add command

These three things have to already be true in the consumer app; nothing the
registry installs can substitute for them.

1. **Tailwind v4, CSS-first config.** `@import "tailwindcss";` in the global
   stylesheet, no `tailwind.config.js`. Same requirement as today's copy-in.
2. **`shadcn init` already run.** Establishes `components.json` (alias
   config, `components/ui/` path) that every registry item's install path
   assumes. Running the form-builder add command against a repo that's never
   run `shadcn init` will fail resolving where primitives land.
3. **`@import "tw-animate-css";` added as a top-level import, by hand,
   before anything else in the global stylesheet.** This one can't be
   registry-injected: CSS requires `@import` statements to precede every
   other rule in a stylesheet, but the registry's theme item works by
   *appending* variable definitions into existing `@theme`/`:root` blocks —
   it has no safe way to prepend a new `@import` line ahead of content that's
   already there. Add it yourself, first, the same way `app/globals.css`
   does it in this repo:
   ```css
   @import "tailwindcss";
   @import "tw-animate-css";
   @import "shadcn/tailwind.css";
   ```

## 2. Installing the aggregate or individual fields

- `<the form-builder add command> form-builder` — installs the whole
  self-contained tree: headless (`core`/`hooks`/`store`) + rendered
  (`ui`/`components`/`fields`) + the 17 vendored shadcn primitives. Per
  ADR-0003 Option A, this does **not** install `@form-builder/engine` from
  npm — the copied fields relative-import `../core/*`/`../hooks/*` directly.
- `<the form-builder add command> field-phone field-otp ...` — installs only
  the named field types plus their transitive dependencies (shared
  primitives, `core`/`hooks` slices), for consumers who want scoped bundles —
  the same shape as this repo's own `FlagshipSignupForm` scoped-registration
  pattern, but registry-driven instead of hand-rolled.
- The exact binary/command name is still being finalized by the build owner.
  Treat `<the form-builder add command>` as a placeholder; a likely shape is
  a thin Node wrapper (e.g. `node scripts/form-builder-add.mjs <items...>`)
  that resolves the transitive graph itself and calls `shadcn add` once with
  explicit local paths — see ADR-0003 "Registry mechanics" for why the
  wrapper has to own that resolution (`registryDependencies` doesn't resolve
  local/`file://` references).

## 3. What the registry auto-injects vs. what stays manual

- **Auto-injected**, via a `registry:theme` item in the manifest:
  `--breakpoint-tablet`/`--breakpoint-desktop`, the shadcn
  `--color-*`/`--radius-*` token block, and the `--fb-space-*` sizing scale.
  Verified working in the spike.
- **Stays manual:** the `tw-animate-css` `@import` line (§1.3) and, if this
  is the consumer's first shadcn item ever, the `@import "shadcn/tailwind.css";`
  line `shadcn init` itself normally wires up.

## 4. Runtime step — same as today

Call `registerBuiltInFields()` once, before any `FormRenderer` mounts —
unchanged from the current copy-in flow. For a scoped `field-<type>` install,
register only the fields you installed instead of the full built-in set.

## 5. Troubleshooting

- **`tablet:`/`desktop:` classes silently doing nothing.** The
  `registry:theme` item didn't run, or ran without the consumer's Tailwind
  config actually scanning the copied files. Check that
  `--breakpoint-tablet`/`--breakpoint-desktop` are present in the compiled
  CSS — if they're missing, every `tablet:`/`desktop:` class in the engine
  compiles to nothing and the layout never leaves its mobile styles (same
  failure mode as the current copy-in flow, see
  `components/docs/installation/CssSetupSection.tsx`).
- **"Field type not registered" at render.** Either
  `registerBuiltInFields()` (or the scoped per-field register call) wasn't
  called before the first `FormRenderer` mount, or it ran in a different
  module-graph instance than the one `FormRenderer` reads from. The second
  case should not happen through the copy-in door alone — it's the failure
  mode ADR-0003's `globalThis`/`Symbol.for` registry anchor exists to
  prevent when a host runs the copy-in *and* separately npm-installs
  `@form-builder/engine` in the same app.

## Cross-links

- [ADR-0003](../adr/0003-packaging-split-distribution.md) — Decision → Unit B
  and "Registry mechanics" for the ratified model and the two verified
  registry constraints this guide assumes.
- `docs/plans/2026-07-17-packaging-analysis.md` §5.1, §6, §7 — build/tooling
  summary, documentation requirements, phased migration plan.
- `components/docs/installation/*` — the **currently shipped** install flow
  (zip/manual copy-in). This guide supersedes those pages once Phase 2 ships
  and the wrapper command name is finalized; until then they're the accurate
  instructions for real consumers.
