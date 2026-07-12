# ADR-0002: `(site)` route group with a single shared shell; flat `components/home` sections

<!-- File naming: adr-0001-use-postgres.md — zero-padded, kebab-case. -->
<!-- One ADR per decision. Keep it short; link out for detail. -->

- **Status:** Accepted
- **Date:** 2026-07-12
- **Deciders:** staff-engineer, documentation-engineer (recorded)
- **Tags:** frontend, architecture, routing

## Context

Before this refactor, the landing page (`app/page.tsx`), `app/docs/**`, and
`app/examples/**` each rendered their own `<SiteNav />` independently at the
top of their own layout/page — three separate copies of
`<div><SiteNav />{children}</div>`. `app/page.tsx` was also a large,
undecomposed file mixing hero, showcase, demo, feature-grid, and
comparison-strip markup in one place, making any single section hard to
find or change in isolation.

Separately, `/builder` (`app/builder/page.tsx`) is a full-height workspace
tool, not a marketing/docs page — it deliberately has no site chrome
(no `SiteNav`, no footer). It needed to stay structurally outside whatever
shared-shell mechanism the marketing/docs/examples pages adopted.

The team needed: one place that owns "every route gets `SiteNav`" instead
of three, a way to keep `/builder` outside that without a special case in
the shell itself, and a decomposition strategy for the landing page that
wouldn't over-engineer a page that currently has exactly one page's worth
of sections.

## Decision

We will group every marketing/docs/examples route under an `app/(site)/`
route group with a single shared layout, and decompose the landing page
into flat section components under `components/home/`.

Specifics:

- `app/(site)/layout.tsx` renders `<SiteNav />` once, wrapping
  `{children}`. URL paths are unchanged — a Next.js route group
  (parenthesized segment) does not appear in the URL, so `/`, `/docs/*`,
  `/examples/*` keep their existing paths.
- `app/(site)/page.tsx` (the landing page, route `/`), `app/(site)/docs/**`,
  and `app/(site)/examples/**` all live inside the group and inherit the
  shared shell. Each surface keeps its own page-specific container/shell
  (docs sidebar shell, examples narrow column, landing sections) — the
  route group only owns the outermost `SiteNav` wrapper, not per-surface
  layout.
- `app/builder/page.tsx` stays **outside** `(site)`, at the top level of
  `app/`. This is deliberate, not an oversight: the builder is a
  chrome-minimal, full-height workspace with no `SiteNav` and no footer.
  Keeping it outside the group means the shell has no conditional
  ("except for `/builder`") — the absence of chrome falls out of the file
  tree itself.
- The landing page (`app/(site)/page.tsx`) is decomposed into flat,
  single-purpose section components directly under `components/home/`:
  `HeroSection`, `ShowcaseSection`, `DemoSection`, `BuilderCodeSplit`,
  `FeatureGrid`, `ComparisonStrip`, `FinalCta`, plus `SectionHeading`
  (shared heading primitive) and `LandingDemoForm` (the one interactive
  client leaf, isolated inside `DemoSection`). `content.ts` holds
  structural, non-copy data (icon refs, hrefs, decorative widths, the
  code snippet shown to the reader); `demoConfig.ts` holds the hero demo's
  `FormConfig`. `app/(site)/page.tsx` itself is a thin composer — it
  imports the sections and lays them out in a single container, with no
  section-specific markup of its own.
- Shared-primitive placement policy, applied while extracting the above:
  - `components/ui/` — base primitives with no feature knowledge (this
    refactor added `alert.tsx`, `segmented-control.tsx`).
  - `components/shared/` — cross-feature primitives used by more than one
    top-level surface (this refactor added `LinkCard.tsx` and
    `containers.ts`, the page-shell width constants for nav/docs/landing/
    examples).
  - Feature folders (`components/home/`, `components/docs/`,
    `components/examples/`, `components/builder/`) own anything used by
    only one surface. A component only gets promoted to `shared` on a rule
    of three (used, or clearly about to be used, by three or more
    surfaces) — premature promotion to `shared` was rejected during this
    refactor in favor of leaving single-surface components (e.g.
    `ExamplePageShell`) in their feature folder.
- `containers.ts` exports one named width constant per surface
  (`NAV_CONTAINER`, `DOCS_CONTAINER`, `LANDING_CONTAINER`,
  `EXAMPLES_CONTAINER`) as full static Tailwind class strings, rather than
  a single generic `<Container maxWidth="...">` component. The different
  widths are a deliberate content-register difference (docs carries a
  sidebar + TOC and is widest; examples is a narrow reading column;
  landing is a centered marketing column) — collapsing them into one
  parameterized component would imply they should converge, which they
  are not meant to.

## Consequences

### Positive
- Adding a new marketing/docs/examples page automatically gets `SiteNav`
  by virtue of living under `app/(site)/` — no per-page chrome wiring to
  remember or forget.
- `/builder`'s chrome-less layout can't regress by someone "helpfully"
  adding `SiteNav` to a shared layout it's supposed to be exempt from —
  it's structurally outside the group that owns that layout.
- Each landing section is independently readable, testable in isolation,
  and small enough to hold in your head; finding "the demo panel" means
  opening `DemoSection.tsx`, not scrolling a few-hundred-line
  `app/page.tsx`.
- The nav bar's desktop width cap is pinned to `DOCS_CONTAINER`'s value
  (1320px) via a comment in `containers.ts`, not by accident — the header
  edge is meant to line up with the widest content edge site-wide.

### Negative
- Every marketing/docs/examples route now has one more level of
  directory nesting (`app/(site)/...`) to navigate, and route groups are
  an easy-to-forget Next.js convention for anyone unfamiliar with them
  (the parentheses don't show up in the URL, which can confuse a first
  read of the file tree).
- Four container constants (`NAV_CONTAINER`/`DOCS_CONTAINER`/
  `LANDING_CONTAINER`/`EXAMPLES_CONTAINER`) must be kept in sync by hand
  where they're meant to align (the nav/docs width match) — nothing
  enforces that relationship beyond the comment in `containers.ts`.

### Neutral
- `/builder` being outside `(site)` means it does not benefit from any
  future shared-shell addition (e.g. a footer) without an explicit,
  separate decision to add it there too.

## Alternatives considered

- **Deep `components/home/sections/{HeroSection,...}/` folders per
  section** (e.g. an `index.tsx` + co-located styles/tests per folder) —
  rejected as YAGNI: every section here is a single component with no
  sub-components or per-section test file today; a flat
  `components/home/HeroSection.tsx` is one hop away instead of two, and
  the deeper structure can be introduced later for a specific section if
  and when it actually grows sub-parts.
- **A single generic `<Container maxWidth={...}>` component** instead of
  named width constants — rejected: it invites passing an arbitrary width
  at each call site, which erodes the "four deliberately distinct content
  registers" invariant `containers.ts`'s comment exists to protect. Named
  constants make the four surfaces enumerable and their relationship
  (nav aligns to docs) documentable in one place.
- **Keeping each surface's own `<SiteNav />` render** (status quo) —
  rejected: three independent copies of the same wrapper markup is exactly
  the drift risk this refactor set out to remove.
- **Splitting `components/builder/model/store.ts` into smaller files** as
  part of this pass — considered and deferred (not rejected outright) per
  a staff-engineer YAGNI ruling: the file is cohesive single-store state
  logic; splitting it without a concrete pain point (e.g. a specific slice
  that needs independent testing or reuse) would trade one large,
  navigable file for several smaller ones with cross-file coupling and no
  proven benefit. Revisit if `store.ts` grows further or a slice needs to
  be reused outside the store.
- **Rewriting landing page copy as part of this refactor** — explicitly
  out of scope: this refactor moved and decomposed existing markup and
  extracted existing copy into `locales/`, but did not rewrite marketing
  copy itself. Copy rewrites are product-owned, not an engineering
  refactor decision.

## References

- `app/(site)/layout.tsx`, `app/(site)/page.tsx`, `app/builder/page.tsx`
- `components/shared/containers.ts`
- `components/home/*.tsx`, `components/home/content.ts`
- ADR-0001: Typed TS dictionary for site copy, no locale routing
