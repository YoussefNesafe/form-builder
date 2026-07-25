# Logo / Brand Identity — Design

**Date:** 2026-07-26
**Status:** Approved (brainstorming complete → ready for implementation plan)
**Scope:** A single logo system for the "Form Builder" product, usable across the website, npm, favicon, social cards, and app icons.

## Goal

One mark that collapses to a **symbol** legible at 16px (favicon, npm avatar) and pairs with a **wordmark** on the site. Must obey the product's flat aesthetic (borders/strokes, never shadows/gradients/rings) and work on both the dark site and npm's white README.

## Existing brand facts (inputs)

- Site background: near-black `#0a0a0a`; foreground `#fafafa`; muted `#a3a3a3`.
- Accent: periwinkle **`#7f98f5`** (already the OG-image accent bar).
- Type: **Geist** (sans) + Geist Mono, already loaded in `app/layout.tsx`.
- Proto-mark today: a 12px periwinkle vertical bar in `app/opengraph-image.tsx`.
- Product line: `@form-builder/engine` (npm, placeholder name) + `form-builder-nextjs` (CLI). Site: `form-builder.youssefnesafe.com`.

## Concept

**Stacked form-field rows wrapped in code braces `{ }`.** Braces = the config/JSON the engine consumes; rows = the rendered form. The mark tells the whole story: *config in → real form out*. This was chosen over field-morphs-to-code, a caret/brace hybrid, and an F/FB monogram.

## Geometry

Master drawn on a **24×24 viewBox** (matches lucide-react, already a dependency, so the mark sits naturally beside lucide icons).

```
   ⎧  ▬▬▬▬▬▬   ⎫      row 1 = 100% inner width
   ⎪  ▬▬▬▬     ⎪      row 2 =  65% inner width
   ⎩  ▬▬▬▬▬    ⎭      row 3 =  80% inner width
```

- **Braces:** left `{` and right `}`, stroke ~2px at 24px scale, round joins.
- **Rows:** 3 filled bars, small corner radius (reads as input fields), evenly spaced vertically. Widths deliberately **unequal** so it reads as a real form (echoes the current OG image's varied widths).
- **Flat only:** stroke/fill, no shadow, gradient, or ring.

## Color (two-tone, auto-adapting)

- **Braces:** fixed periwinkle **`#7f98f5`** — the ownable brand hue.
- **Rows:** **`currentColor`** — near-white on the dark site, near-black on npm's white README, inherits nav text when inline. One SVG adapts to every surface (this is the "swap the neutral" the user approved, done automatically).

## Small-size / favicon variant

A **separate optimized SVG**: **2 rows, heavier strokes**, thickened braces. Prevents the 3-row stack from mushing at 16px. This variant is the source for the `.ico` / browser-tab icon.

## Wordmark lockup

- Mark + "Form Builder" set in **Geist Semibold** (weight 600, `-0.02em` tracking — matches the OG image).
- **Horizontal** lockup (mark left, wordmark right) is primary; **stacked** is secondary.
- On-site: live Geist text beside the inline SVG mark (no extra asset).
- Standalone `.svg` / `.png` for the README + marketing: wordmark text **outlined to paths** so it carries no font dependency.

## Deliverables

| Asset | Format | Use |
|---|---|---|
| `logo-mark.svg` | SVG (rows `currentColor`, braces periwinkle) | source of truth, inline nav |
| `logo-mark-sm.svg` | SVG, 2-row heavy | favicon / tab |
| `logo-wordmark.svg` + `.png` | outlined paths | README, marketing |
| `app/icon.svg` | Next file-convention | auto favicon (replaces bare `favicon.ico`) |
| `app/apple-icon.png` | 180×180 on rounded periwinkle tile | iOS home screen |
| `app/opengraph-image.tsx` | edit existing | swap plain bar → new mark, keep layout |
| `logo-512.png` | PNG on tile | npm org avatar (set manually on npmjs.com) |
| icon PNGs | 16 / 32 / 48 / 192 | fallbacks |

**Tile rule:** only `apple-icon` and the npm avatar sit on a rounded tile (they need edges at tiny standalone sizes). The bare bracket mark is tile-free everywhere else.

## Wiring

- Master SVGs live in `public/brand/`.
- App icons via Next `app/` file conventions (supersedes the current `app/favicon.ico`).
- `app/opengraph-image.tsx` edited in place — same 1200×630 layout, the periwinkle bar replaced by the new stacked-braces mark.
- README references the committed wordmark asset.

## Constraints / notes for implementation

- Build-time font fetch is disallowed (see AGENTS.md / OG image comment) — the wordmark's outlined-paths version avoids any runtime font dependency for standalone assets.
- Keep the responsive-triplication and flat-style repo conventions in any on-site markup that renders the mark.
- Do not introduce shadows, gradients, or rings anywhere in the mark.

## Rejected alternatives

- **Field-morphs-to-code** (input dissolving into `</>`): busiest, risked mush at favicon size.
- **Caret + brace hybrid:** most minimal / brand-continuous but under-told the "form" half.
- **F / FB monogram:** generic, weakest story.
- **Mono periwinkle** and **currentColor-only** marks: lost the code-vs-content two-tone distinction.
- **Tile behind every mark:** over-heavy; reserved tiles for standalone app-icon contexts only.
