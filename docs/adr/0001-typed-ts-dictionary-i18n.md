# ADR-0001: Typed TS dictionary for site copy, no locale routing

<!-- File naming: adr-0001-use-postgres.md — zero-padded, kebab-case. -->
<!-- One ADR per decision. Keep it short; link out for detail. -->

- **Status:** Accepted
- **Date:** 2026-07-12
- **Deciders:** staff-engineer, documentation-engineer (recorded)
- **Tags:** i18n, frontend, bundle-size

## Context

The site (`app/(site)/`) and the visual builder (`components/builder/`) had
user-facing copy hand-written inline in JSX and in scattered structural data
files. Two concrete problems had already surfaced from that:

- Field-type copy existed in two places that drifted independently — the
  docs field-types reference table had its own `FIELD_TYPE_INFO` map, and
  the builder's `FIELD_META` carried a separate `label` per type. Nothing
  enforced they said the same thing.
- There is exactly one locale (`en`) shipping today, but the product is
  public-facing (see product-discovery decision to ship as a public product)
  and a second locale is a plausible future ask, not a hypothetical one.

The team needed a copy source that (a) eliminates the two-copies-of-the-same-
label problem for good, (b) doesn't cost bundle size on client components
that only need a slice of the copy, and (c) doesn't force a locale-routing
migration (`/en/...`, `/fr/...`) before there is a second locale to justify
one.

## Decision

We will store all site/builder copy in a typed TypeScript dictionary under
`locales/`, composed as plain nested object literals — not JSON, not ICU
message files, not a runtime i18n framework.

Structure:

- `locales/en/*.ts` — one module per domain (`common`, `nav`, `home`, `docs`,
  `examples`, `fieldTypes`, `builder`), each exporting a typed `const`
  object.
- `locales/en/index.ts` — composes the domain modules into a single `en`
  object.
- `locales/index.ts` — the public entry point. Exports:
  - `t` — direct nested access to the composed `en` dictionary, for server
    components.
  - `getDictionary(locale: Locale = "en")` — a lookup seam for a future
    second locale. It is not wired to anything yet; it exists so that
    adding a locale is additive (register it in the `dictionaries` map)
    rather than a rewrite of every `t.foo.bar` call site.
  - `fmt` — `{name}`-placeholder interpolation, re-exported from the
    standalone `locales/fmt.ts` (see consumption rules below for why it's
    split out).

Consumption rules, enforced by convention and code review (not by lint):

- Server components import the aggregate `t` from `@/locales`.
- Client components import their domain slice directly (e.g.
  `@/locales/en/builder`, `@/locales/en/fieldTypes`), never the aggregate —
  so an unrelated domain's strings don't ride along into that client
  bundle. `locales/fmt.ts` is deliberately import-free (no dependency on
  the `en` aggregate) so a client leaf that only needs interpolation isn't
  forced to pull in the rest of the dictionary either.
- Collections are keyed by a stable slug (e.g. `docs.nav.descriptions`,
  `home.showcase.cards`), never by array index — index-keying breaks the
  moment entries are reordered.
- `locales/` has a one-way dependency on the engine: it may import the
  `FieldType` union and other public types from `@/form-builder`, but it
  never imports from `components/builder/**`. The reverse holds too: the
  builder is a one-way *consumer* of `locales/en/fieldTypes.ts`, never a
  source for it. The single exception is test-only, in
  `locales/fieldTypes.test.ts`, which imports `FIELD_META` from the builder
  to pin that field-type `label`s were fully removed from it (see below) —
  the import is explained in a comment at its call site so it isn't mistaken
  for a real dependency.
- `fieldTypes` (`locales/en/fieldTypes.ts`) is the single source for every
  built-in field type's `label`/`description`/`note`, consumed by both the
  docs field-types table and the builder's add-field menu, field-list rows,
  and prop-editor header. The builder's own `FIELD_META` (in
  `components/builder/model/fieldMeta.ts`) is structure-only now (`group`,
  `icon`) — it no longer carries a `label` field at all, so a second label
  source can't silently reappear. `locales/fieldTypes.test.ts` pins both
  halves: every built-in type has a non-empty label/description, and
  `FIELD_META` has no `label` property.
- Long-form docs prose (the actual multi-paragraph H2 section bodies on
  installation/your-first-form/conditions/wizards/field-types) is **not**
  extracted into `locales/` — it stays in JSX where it lives. Only the docs
  *chrome* (TOC/pagination/breadcrumb strings, nav titles, index-page card
  descriptions) moved to `locales/en/docs.ts`. This was a staff-engineer
  ruling: multi-paragraph prose with inline `<code>`/links loses more than
  it gains by being pushed through a placeholder-interpolation string —
  JSX is the more precise medium for it.
- Not translated (deliberately stays as plain TS/JSX, not a dictionary
  concern): demo form configs (`components/home/demoConfig.ts`,
  `app/(site)/examples/**/config.ts`), code snippets shown to the reader
  (e.g. `components/home/content.ts`'s `CODE_SNIPPET`), field/identifier
  names, and seed/placeholder data a user immediately overwrites in the
  builder (`"Untitled Form"`, `"Option 1"`, `"Step 1"`).

## Consequences

### Positive
- One drift-proof source for field-type copy; `locales/fieldTypes.test.ts`
  fails the build if a second label source reappears or a type's copy goes
  missing.
- Client bundle impact of the dictionary is scoped to what a given client
  component actually imports, because domain modules are separate files
  and client leaves import their slice directly instead of the aggregate.
- Adding a second locale later is additive: a new `locales/<locale>/`
  tree plus a `dictionaries` map entry, no call-site rewrite, because `t`
  and `getDictionary` already exist as the seam.
- Copy review is a normal PR diff on plain `.ts` object literals — no
  separate translation-management tool or build step.

### Negative
- The one-way-dependency and client-slice-import rules are conventions,
  not compiler-enforced (aside from the single test-pinned exception) — a
  careless import can violate them without a build failure.
- No pluralization/ICU-grade formatting exists yet (`fmt` only does
  `{name}` substitution). If a future string needs plural rules, this
  scheme grows a second helper rather than getting one for free.
- Terse keys are a deliberate constraint (see CONTRIBUTING.md — max 3
  path segments), which occasionally forces a slightly less descriptive
  key name than an unconstrained nested structure would allow.

### Neutral
- `getDictionary(locale)` has no second locale to serve today; it is
  unused in production code paths and exists purely as a seam. It is not
  scaffolding to delete — it is intentionally inert until a second locale
  ships.

## Alternatives considered

- **`en.json` + codegen for types** — rejected: adds a build step (codegen)
  to get what a plain `.ts` file gives for free (TypeScript checks the
  shape at edit time, autocomplete works immediately, no generated-file
  drift between edits and the last codegen run).
- **Dotted-path lookup, `t("home.hero.title")`** — rejected: loses
  autocomplete and compile-time typo detection; a missing key becomes a
  runtime `undefined` instead of a type error. The nested-object form
  (`t.home.hero.title`) gets both for free.
- **One monolithic `en.ts`** — rejected: every client component that
  imported the aggregate would pull in every domain's strings, defeating
  the bundle-hygiene goal; also a merge-conflict magnet with several
  people editing unrelated copy in the same file.
- **`next-intl` (or similar) with locale routing** — rejected for now:
  there is exactly one locale. Locale-prefixed routing
  (`/en/...`) is a URL-shape change with no current second locale to
  justify it, and `next-intl`'s runtime (provider, message loading,
  `useTranslations` hook) solves problems (pluralization, ICU formatting,
  server/client message splitting) this app doesn't have yet. Revisit if
  and when a second locale is actually committed to.
- **Extracting long-form docs prose into the dictionary** — rejected per
  staff-engineer ruling (see Decision) — prose with inline markup is worse
  as a placeholder-interpolated string than as JSX.

## References

- `locales/index.ts`, `locales/en/index.ts`, `locales/fmt.ts`
- `locales/en/fieldTypes.ts`, `locales/fieldTypes.test.ts`
- `locales/en/docs.ts` (staff-engineer ruling comment on long-form prose)
- ADR-0002: (site) route group and shared site shell
