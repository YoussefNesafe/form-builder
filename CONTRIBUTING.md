# Contributing

Practical how-tos for the common changes in this repo. For the shape of the
config engine itself, read `form-builder/core/types.ts` and `AGENTS.md`
first — this file is about where things live, not what they mean.

## Add a new site page

1. Create it under `app/(site)/<route>/page.tsx` — the `(site)` route
   group gives it `SiteNav` for free via `app/(site)/layout.tsx` (route
   groups don't appear in the URL). Only `/builder` stays outside `(site)`;
   don't add a new chrome-less route without a specific reason.
2. Export `metadata: Metadata` with a `title` pulled from `t` (e.g.
   `t.docs.nav.pages.<page>`), not a hardcoded string.
3. Wrap the page content in the width constant for its surface, from
   `components/shared/containers.ts` (`DOCS_CONTAINER`, `LANDING_CONTAINER`,
   `EXAMPLES_CONTAINER`) — don't invent a new max-width inline. If the page
   doesn't fit an existing surface, that's a signal to talk to `architect`
   before adding a fourth constant.

## Add a landing section

1. New section component goes in `components/home/<SectionName>.tsx` —
   flat, no subfolder (see ADR-0002 for why sections stay flat).
2. Compose it into `app/(site)/page.tsx` in the section order you want it
   to render — the page itself is a thin list of `<Section />` calls, no
   markup of its own.
3. Copy goes in `locales/en/home.ts` under a key matching the section
   name; structural/non-copy data (icon refs, hrefs, decorative widths,
   code snippets) goes in `components/home/content.ts` instead. If the
   section needs interactivity, isolate the client boundary to the
   smallest possible leaf (see `LandingDemoForm` inside `DemoSection`) —
   don't make the whole section a client component for one interactive
   part.

## Add a translation string

1. Pick the right domain file under `locales/en/`: `common` (cross-cutting
   chrome), `nav`, `home`, `docs`, `examples`, `builder` (visual builder
   chrome only — not field-type copy, see below), `fieldTypes` (built-in
   field type label/description/note).
2. Keep the key path to 3 segments or fewer (e.g. `home.demo.title`, not
   `home.sections.demo.heading.title`) — deep nesting fights the point of
   a typed dictionary.
3. Any collection (cards, nav items, step lists) is keyed by a stable
   slug, never by array index — index keys break the moment entries are
   reordered.
4. Server components import the aggregate: `import { t } from "@/locales"`.
   Client components import their domain slice directly:
   `import { builder } from "@/locales/en/builder"` — never the aggregate
   from a client component, so unrelated domains don't ride along into
   that bundle.
5. Need `{name}`-style interpolation? Use `fmt` from `@/locales` (or
   `@/locales/fmt` directly in a client leaf that doesn't otherwise need
   `t`) — don't hand-roll template concatenation.
6. What NOT to extract: long-form docs prose (the multi-paragraph H2
   bodies on docs content pages — stays in JSX, staff-engineer ruling),
   demo/example `FormConfig`s, code snippets shown to the reader, field
   names/identifiers, and seed/placeholder data a user immediately
   overwrites in the builder (`"Untitled Form"`, `"Option 1"`). See
   ADR-0001 for the full rationale.

## Add a docs page

1. Create `app/(site)/docs/<slug>/page.tsx`. Use `DocsIntro`,
   `DocsSection`, `DocsFootnote`, and the `DocsBody`/`DocsInlineCode`
   primitives from `@/components/docs/DocsProse` for the prose shell —
   don't hand-roll heading/paragraph markup.
2. Register the page in `lib/docsNav.ts` (`DOCS_NAV_GROUPS`) — this is the
   single structural source for both the sidebar and prev/next
   pagination, so adding it there updates both. The group/page *titles*
   come from `locales/en/docs.ts` (`docs.nav`); `docsNav.ts` only owns
   href/order/grouping.
3. If the page has a table of contents, each `TOC_ITEMS` entry's `id`
   must match a `<DocsSection id="...">` in the same file exactly —
   `app/(site)/docs/toc.test.ts` scans page source and fails the build on
   any mismatch in either direction (a TOC id with no matching heading, or
   a heading missing from the TOC).
4. Long-form section prose is written directly in the page's JSX (inside
   each `<DocsSection>`), not extracted to `locales/` — see "Add a
   translation string" above.

## Add a builder field type's copy

1. Add the type's `label`/`description`/(optional) `note` to
   `locales/en/fieldTypes.ts` — this is the *only* place field-type copy
   lives; it's consumed by both the docs field-types table and the
   builder's add-field menu / field-list rows / prop-editor header.
2. Don't add a `label` to `components/builder/model/fieldMeta.ts`'s
   `FIELD_META` — that file is structure-only (`group`, `icon`) by design.
   `locales/fieldTypes.test.ts` fails the build if `FIELD_META` grows a
   `label` property again or if `fieldTypes.ts` is missing a non-empty
   `label`/`description` for any type in `BUILT_IN_FIELD_TYPES`.
3. Also add the type's `icon` (a `FieldIconName` key from
   `components/builder/ui/FieldIcon.tsx`'s `ICONS` map) and `group` to
   `FIELD_META` — a typo'd icon name is a compile error, not a runtime
   blank icon.
