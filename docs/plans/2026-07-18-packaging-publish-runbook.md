# Publish runbook + versioning policy — `@form-builder/engine`

_Date: 2026-07-18 · Status: infra-only, publish not yet executed_

This is the doc the **owner** follows to actually ship Unit A (the headless
engine) to npm. It covers what Phase 3 built — the tag-triggered release
workflow, a bundle-size CI gate — and what Phase 3 deliberately did **not**
do: publish. Publishing needs a real package name, an npm account, and a CI
secret, all of which only a human owner can provide.

Read alongside [ADR-0003](../adr/0003-packaging-split-distribution.md) (the
split-packaging decision) and the
[Phase 2 install guide](2026-07-18-packaging-phase2-install-guide.md) (the
copy-in/registry side, Unit B, which this runbook does not publish).

## Deferral notice — read this before touching live docs

**Do not wire `components/docs/installation/*` or the README to
`npx <cli-name>` until the CLI package (§6) is actually published under its
real, final name.** Those pages currently describe the shipped-and-working
flow (copy the folder, add shadcn primitives, call `registerBuiltInFields()`)
and that stays accurate and correct until a real `npx <cli-name>` resolves
to something that exists on npm.

> **Correction (2026-07-18):** an earlier version of this notice gated the
> docs cutover on TWO conditions — Unit A published, and the Phase 2
> registry hosted at a public URL. Neither applies to the CLI path anymore:
> the CLI (§6) doesn't depend on Unit A's publish state at all, and it
> carries its own vendored source in the npm tarball rather than fetching a
> hosted registry manifest at install time (see §4's superseded note and
> §6c). **The only real gate is: has `cli/`'s package actually been
> published under its final name?** Once §6b's steps are done, the docs
> cutover is safe.

Pointing real visitors at `npx <a-name-nobody-published>` before that's true
is worse than the current manual instructions — it's documentation that
lies. The Download→CLI cutover is tracked as a post-publish follow-up (§5),
not part of this runbook's scope.

## 1. Pre-publish checklist (owner-only, one time)

None of this can be automated — it requires an npm account and a naming
decision only the project owner can make.

- [ ] **Pick a real package name.** `@form-builder/engine` is a placeholder
      scope (nobody owns the `form-builder` npm org). Decide the real name
      now, since it appears in three places that all need to change
      together:
  - `form-builder/package.json` — the `"name"` field (and update the
    `"description"` field's "placeholder for the owner to rename" note away
    once renamed).
  - `docs/adr/0003-packaging-split-distribution.md` — multiple mentions of
    `@form-builder/engine` as "scoped name is a placeholder pending a public
    name." **Do not edit the accepted ADR in place** — its Decision section
    is a historical record of what was ratified under that placeholder name.
    If the rename is worth recording, add a short dated addendum note or a
    superseding ADR; don't rewrite ADR-0003's body.
  - `docs/plans/2026-07-18-packaging-phase2-install-guide.md` — references
    `@form-builder/engine` when explaining what the registry add command
    does *not* install as a dependency. Update this draft directly (it's a
    plan doc, not an immutable ADR) once the name is final.
  - Also grep for the string before publishing — `tsup.config.ts` derives
    its `external` list from `package.json` fields programmatically (no
    hand-typed name there), but double-check `headless.ts`, any `exports`
    map comments, and CI config for a stray hard-coded reference.
- [ ] **Decide public vs. scoped-restricted.** A scoped name
      (`@yourorg/form-builder`) defaults to restricted/private on npm unless
      published with `--access public`; an unscoped name is public by
      default. Given the project's stated goal (public product, npm
      ergonomics for the headless engine — see
      `project_product_discovery` decisions), plan on **scoped + public**
      (`--access public` explicitly, not relying on the default) unless the
      owner has a reason to gate access.
- [ ] **Reserve the name on npm.** `npm view <chosen-name>` first to confirm
      it's free (a 404 means available); an unscoped name is a one-shot
      claim, so don't guess-and-check against the real registry — use
      `npm view` (read-only) rather than a throwaway `npm publish` to probe
      availability.
- [ ] **Create an npm automation token.** npm → Access Tokens → Generate New
      Token → **Automation** type (bypasses 2FA prompts for CI, scoped to
      publish only — not a personal "Publish" token tied to your login
      session). Granular access tokens scoped to just the one package are
      preferable to a classic automation token if the org's npm plan
      supports them.
- [ ] **Add it as the `NPM_TOKEN` GitHub repo secret.** Repo → Settings →
      Secrets and variables → Actions → New repository secret → name it
      `NPM_TOKEN` exactly (the release workflow, below, reads that name).
      Never commit the token value anywhere, including in this doc's
      examples.

## 2. Release procedure

### 2a. Tag-triggered `release.yml` (primary path)

Devops is wiring `.github/workflows/release.yml` in parallel with this
runbook (not yet in this branch as of 2026-07-18 — confirm it has landed on
`master` before relying on it). Per the Phase 3 scope handed to devops, it:

- Triggers on a version tag push matching `v*` (e.g. `v0.1.0`,
  `v1.2.0-beta.1`) — confirm the exact glob in the workflow file once it
  lands, since `v*` vs. a stricter `v[0-9]+.[0-9]+.[0-9]+` pattern changes
  whether prereleases tag-trigger too.
- Also exposes a `workflow_dispatch` trigger with a `dry-run` boolean input
  — **use this to validate the pipeline (build, pack, gate checks) without
  actually publishing** before you cut a real tag. Run it once on a branch
  before the first real release.
- Builds and publishes **the Unit A headless package only**
  (`form-builder/dist/headless.*` via `tsup`) — it does not touch Unit B
  (copy-in/registry), which has no npm artifact per ADR-0003.
- Runs the CI bundle-size budget (also devops, Phase 3) as a gate before
  publish — a release that blows the budget should fail the workflow, not
  publish an oversized package.

**Tag format:** `v<major>.<minor>.<patch>` (plain semver, no `engine-`
prefix — there is only one publishable package in this repo, so the tag
doesn't need a component prefix to disambiguate). Cut the tag from `master`
only, after the corresponding `form-builder/CHANGELOG.md` entry is merged.

```bash
git checkout master && git pull
git tag v0.1.0
git push origin v0.1.0
```

Confirm the workflow run in the Actions tab, then confirm the version landed
on npm (`npm view <name> versions`).

### 2b. Manual fallback

If the workflow is unavailable, broken, or you need an out-of-band publish
(e.g. a hotfix while CI is down), publish by hand from a clean checkout:

```bash
cd form-builder
yarn build            # runs tsup, regenerates dist/headless.{js,cjs,d.ts}
npm pack --dry-run    # pre-check — see below
npm publish --access public
```

Bump `"version"` in `form-builder/package.json` **before** running this —
neither `yarn build` nor `npm publish` bumps it for you, and npm rejects a
publish of a version that already exists on the registry.

### 2c. Pre-publish sanity check: `npm pack --dry-run`

Run this before every publish, tag-triggered or manual — it prints exactly
the file list and tarball size npm would ship, without touching the
registry:

```bash
cd form-builder
npm pack --dry-run
```

Check the output against the `"files"` field in `package.json` (currently
`["dist", "theme"]`): the tarball should contain `dist/headless.js`,
`dist/headless.cjs`, `dist/headless.d.ts`, the sourcemaps, and
`theme/tokens.css` — nothing from `core/`, `hooks/`, `ui/`, `components/`,
`fields/` as raw `.ts` source (those are Unit B, copy-in only, and should
never appear in the npm tarball). If a stray file shows up, check the
`"files"` array and `.npmignore`/`package.json` `"files"` precedence before
publishing.

## 3. Versioning policy (semver)

`@form-builder/engine`'s compatibility contract is **not** "does the code
still run" — it's the shape of `FormConfig` and the registration/export
surface a consumer's code is written against. Three things count as the
public contract:

1. **`FormConfig`'s shape** (`form-builder/core/types.ts`). This is the
   source-of-truth type this whole package exists to serve — see
   `AGENTS.md`: "The config shape's source of truth is
   `form-builder/core/types.ts`."
   - **Minor:** adding a new optional field to any config type (a field
     config, a rule, a step). Existing configs keep validating and
     rendering exactly as before.
   - **Major:** removing or renaming a field, narrowing a field's type,
     changing a field from optional to required, or changing what a given
     config shape *validates as* (e.g. a stricter zod refinement that now
     rejects previously-valid configs, or a looser one that now accepts
     previously-invalid ones and changes runtime behavior). Treat a
     validation-semantics change as a breaking change even if the
     TypeScript type is unchanged — a consumer's existing configs can start
     failing (or silently behaving differently) at runtime.
   - **Patch:** bug fixes that make behavior match the documented/intended
     contract without changing the contract itself.
2. **The field-type registry surface** (`registerField`,
   `registerBuiltInFields`, the `getField`/registry read API in
   `core/registry.ts`). Changing the registration function signature, the
   shape a custom field type must implement, or the `globalThis`/`Symbol.for`
   anchor key (`"form-builder.fieldRegistry.v1"` — bumping the `v1` suffix
   is itself a breaking change, by design; see ADR-0003) is major. Adding a
   new optional capability a registered field *may* implement is minor.
3. **The public barrel/export surface** — today just the `exports` map's
   `.` (headless) and `./theme.css` entries. Removing an export, changing
   what a named export resolves to, or changing `./theme.css`'s token names
   in a way that breaks a consumer who imported it is major. Adding a new
   subpath export (e.g. eventually `./react` per ADR-0003 Phase 2+) is
   minor, additive.

**What is explicitly NOT part of the versioned contract:** anything under
`ui/`, `components/`, `fields/` — the rendered layer is copy-in (Unit B, see
§4 below), ships no npm artifact, and isn't semver-tracked by this package
at all. A change to a field component's internal rendering doesn't bump
`@form-builder/engine`'s version, because that code was never in the
tarball.

**Changelog.** `form-builder/CHANGELOG.md` (added by devops as part of
Phase 3, Keep a Changelog format — see `~/.claude/eng-team/standards/` for
the house convention) is the record consumers read to decide whether a bump
is safe to take. Every publish — tag-triggered or manual — needs a
corresponding entry merged first; the release workflow does not generate
changelog prose for you. Confirm `form-builder/CHANGELOG.md` exists and has
an `[Unreleased]`→`[x.y.z]` entry before cutting a tag; if it hasn't landed
yet, this step blocks release until devops's Phase 3 changelog work merges.

## 4. What is NOT published — stays copy-in

Per [ADR-0003](../adr/0003-packaging-split-distribution.md) Decision → Unit
B, the rendered UI layer (`ui/`, `components/`, `fields/`, plus the 17
vendored shadcn primitives) is not part of Unit A's npm package and never
will be under this ADR — see the "Alternatives considered" section there for
why a bundled npm build of the rendered layer was rejected (breaks
`"use client"` boundaries, can't resolve host-owned `@/components/ui/*`).

> **Superseded note (2026-07-18):** an earlier draft of this section
> described Unit B's install mechanism as "the shadcn-registry `add` flow."
> That mechanism was replaced during the Phase 2 build — `cli/` now does a
> direct file copy + install-time import-rewrite instead of shelling
> `shadcn add`, because shadcn's own placement/alias model fought the
> single-folder, fully self-contained result the CLI needs to produce (see
> `docs/adr/0003-packaging-split-distribution.md`'s Decision → Unit B for the
> full reasoning and `cli/src/rewrite.mjs`'s module doc comment for the
> mechanics). Unit B's install path is now **the `cli/` package**, published
> separately from Unit A — see §6 below.

Full install mechanics for that path are in the
[Phase 2 install guide](2026-07-18-packaging-phase2-install-guide.md)
(currently a draft describing unshipped behavior — the guide itself flags
that it supersedes `components/docs/installation/*` only once the CLI ships
and the wrapper command name is final).

**Superseded note (2026-07-18):** this paragraph originally said the
registry manifest (`public/r/*.json`) had to be hosted at a public URL for
`shadcn add <url>` to consume it remotely, and that this hosting was a
required, unresolved dependency of Phase 2's distribution model. That's no
longer true — Unit B's real install path is the `cli/` package (§6), which
carries its own vendored source in its npm tarball and never fetches
anything from a hosted registry URL at install time. `public/r/*.json`
remains a useful human-readable artifact of the item graph, but nothing
about making Unit B installable for outsiders depends on hosting it
anywhere. The only remaining dependency for Unit B to work for real
consumers is publishing `cli/`'s package itself (§6b) — independent of
Unit A's publish state, exactly as before.

## 5. Post-publish follow-ups

Do these only after §1–§2 are complete and a real version is live on npm.
None of them are part of "publish infra" (Phase 3's actual scope) — they're
what makes the publish *useful* to real consumers.

- [ ] **Host the Phase 2 registry manifest.** Deploy `public/r/*.json` (once
      the Phase 2 generator exists/runs) somewhere with a stable public URL
      — this repo's own deployed site is the natural host, since the
      manifest is already generated into `public/`. Replace the
      `{name}`/placeholder host in any registry item cross-references with
      the real deployed URL.
- [ ] **Flip the Download→CLI cutover in live docs.** Update
      `components/docs/installation/*` and the README to point at
      `npm install <real-name>` (Unit A) and
      `shadcn add <hosted-registry-url>` (Unit B) instead of the current
      zip/manual-copy instructions. This is the change explicitly deferred
      at the top of this runbook — do not do it early.
- [ ] **Smoke-test both doors from a fresh app**, not this repo:
  1. `npx create-next-app@latest` (or equivalent) in a scratch directory.
  2. `npm install <real-name>` — confirm the headless import resolves,
     `FormConfig`/`validateFormConfig`/`useDynamicForm` are usable, and no
     `@/components/ui` or Tailwind coupling leaks in (the boundary-guard
     test in this repo checks this at build time, but a fresh-app install
     is the only way to confirm the *published* tarball, not just the
     source, is clean).
  3. `shadcn add <hosted-registry-url>` (once hosted) — confirm the copy-in
     lands, `registerBuiltInFields()` + a rendered `FormRenderer` works, and
     the `tablet:`/`desktop:` breakpoints actually compile (see the Phase 2
     guide's Troubleshooting section for the specific failure mode if they
     don't).
  4. Confirm running **both doors in the same fresh app** doesn't produce
     a "field type not registered" error — this is the scenario the
     `globalThis`/`Symbol.for` registry anchor (ADR-0003) exists to protect,
     and it's never been exercised outside this repo until this smoke test.

## 6. Publishing the CLI (Unit B installer) — a SEPARATE publish from Unit A

This is the only thing that has to be published for the one-command
installer (`npx <name>`) to work for someone outside this repo. It is
**independent of §1–§5 above**: Unit A (the headless engine, `form-builder/`)
and Unit B's installer (`cli/`) are two different npm packages with two
different names, two different `package.json`s, and no dependency on each
other's publish state. You can publish the CLI without ever publishing Unit
A — a consumer who only runs `npx <cli-name>` gets the whole self-contained
`form-builder/` folder (engine + fields + primitives + theme) copied into
their project; they never touch Unit A's npm package at all.

### 6a. What makes `cli/` ready to publish

Everything below is already built and gated — this section is the owner's
remaining one-time steps, not new engineering:

- `cli/src/source.mjs` resolves source from `cli/vendor/` (vendored mode)
  when present, falling back to this monorepo's `../../form-builder` etc.
  (local dev mode) when it isn't. A published tarball only ever contains
  `cli/vendor/`, never the monorepo, so it always runs in vendored mode.
- `cli/scripts/vendor.mjs` produces `cli/vendor/` (a full mirror of
  `form-builder/` minus tests, the 17 vendored shadcn primitives, and a
  precomputed `registry-model.json` + theme cssVars) — gitignored build
  output, regenerated on demand, never hand-edited.
- `cli/package.json`'s `prepack`/`prepublishOnly` scripts run
  `node scripts/vendor.mjs && node scripts/assert-self-sufficient.mjs`
  automatically — `npm pack` and `npm publish` both vendor fresh and then
  fail loudly if `cli/vendor/` is missing or if any runtime file under
  `cli/bin`/`cli/src` has a static import reaching outside `cli/`. You do
  not need to remember to vendor by hand before publishing; the lifecycle
  hook does it, and refuses to produce a broken tarball.
- Verified end-to-end: `npm pack` → extract the tarball into a directory
  outside this repo → run the extracted `bin/form-builder.mjs` against a
  bare temp project (no monorepo access at all) → confirms the full
  self-contained tree lands correctly, zero `@/` alias residue, theme
  `@theme` block written. See the Phase 2 build's verification report for
  the exact commands and output if you want to re-run this proof yourself
  before publishing.

### 6b. Owner steps to actually publish

1. **Pick a real package name and rename it.** `cli/package.json`'s `"name"`
   is currently the placeholder `form-builder-nextjs` — there's a
   `"//name"` comment right next to it flagging this. Change `"name"` to the
   real chosen name. This is independent of Unit A's name (§1) — they can
   share a scope or not; nothing in the code assumes any relationship
   between them.
2. **Decide the `bin` command name.** Today it's `form-builder` (the `bin`
   field in `cli/package.json`, unchanged since Phase 2 — docs were written
   against this name, don't rename it casually). If the owner wants a
   different user-facing command (e.g. to avoid a name collision on a
   consumer's PATH), rename the `bin` key and the `bin/form-builder.mjs`
   file's own filename together, and flag it to whoever owns
   `components/docs/installation/*` so the docs update in lockstep.
3. **Flip `private: true` → `private: false`** in `cli/package.json`. This
   is deliberately still `true` right now — it's the last safety catch
   preventing an accidental publish of a package still named after a
   placeholder scope. Only flip it once step 1 is done and you mean it.
4. **`npm view <chosen-name>`** first (read-only) to confirm the name is
   free, same reasoning as §1 for Unit A — don't guess-and-check against the
   real registry.
5. **Publish:**
   ```bash
   cd cli
   npm publish --access public   # --access public if the name is scoped (@scope/name)
   ```
   `prepublishOnly` vendors fresh and runs the self-sufficiency check
   automatically as part of this command — you do not need a separate
   vendor step first (see 6a).
6. **Confirm it, from OUTSIDE this repo:**
   ```bash
   cd /some/other/project      # a real Next.js app, not this monorepo
   npx <chosen-name>            # installs everything: engine + all fields + all primitives + theme
   # or, for a subset:
   npx <chosen-name> add text email
   ```
   This is exactly the standalone tarball test the Phase 2 build already ran
   against a local `npm pack` — running it again against the real published
   package (via `npx`, which fetches from the real registry instead of a
   local tarball) is the actual proof it works for outsiders.

### 6c. What this does NOT require

- **No hosted registry URL.** §4/§5's "host `public/r/*.json` somewhere"
  concern was specific to the old shadcn-registry mechanism and no longer
  applies to Unit B at all — the CLI carries its own source in
  `cli/vendor/`, baked into the npm tarball. `registry/registry.json` and
  `public/r/*.json` still exist in this repo (generated by
  `scripts/build-registry.mjs`, still useful as human-readable
  documentation of the item graph), but nothing about publishing or running
  the CLI depends on them being hosted anywhere.
- **No `components.json`/`tsconfig.json` in the consumer.** The theme step
  writes directly into the consumer's `globals.css` (see
  `cli/src/theme.mjs`) — it doesn't shell out to shadcn, so it doesn't need
  a shadcn-initialized project. A consumer with nothing but a `package.json`
  and a `globals.css` works.
- **No coordination with Unit A's release.** Publish the CLI whenever it's
  ready; publish Unit A whenever *that's* ready. Neither publish blocks or
  triggers the other.

## References

- [ADR-0003](../adr/0003-packaging-split-distribution.md) — the split-
  packaging decision this runbook operationalizes (Unit A/B, registry
  anchor, peer/bundled dependency split).
- [Phase 2 install guide](2026-07-18-packaging-phase2-install-guide.md) —
  the copy-in/registry consumer flow for Unit B (not published by this
  runbook).
- `cli/package.json` — Unit B's own package manifest; `"name"` is the
  placeholder §6b replaces, `private: true` is the flag §6b flips,
  `prepack`/`prepublishOnly` are what auto-vendors on `npm pack`/`npm publish`.
- `cli/scripts/vendor.mjs` — produces `cli/vendor/` (gitignored build
  output) from this monorepo's `form-builder/`, `components/ui/`, and
  `scripts/build-registry.mjs`; the only place in `cli/` that's expected to
  reach outside it.
- `cli/scripts/assert-self-sufficient.mjs` — the `prepack`/`prepublishOnly`
  gate that fails loudly if `cli/vendor/` is missing or a runtime file
  statically imports outside `cli/`.
- `cli/src/source.mjs` — the dual-mode resolver (vendored vs. local monorepo)
  every other `cli/src` module goes through instead of reaching `../..`
  directly.
- `form-builder/package.json` — current `exports`/`files`/dependency
  shape; `"name"` is the placeholder this runbook's §1 replaces.
- `form-builder/tsup.config.ts` — the headless build; derives its
  `external` list from `package.json` automatically, so a dependency
  add/remove doesn't need a matching tsup edit.
- `.github/workflows/ci.yml` — existing CI (lint/test/build); `release.yml`
  is the new tag-triggered workflow this runbook's §2a describes, landing
  separately via devops.
- `form-builder/CHANGELOG.md` — landing via devops as part of Phase 3;
  required, populated, before every release per §3.
