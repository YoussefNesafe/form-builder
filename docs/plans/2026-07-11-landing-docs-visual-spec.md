# Landing + docs visual overhaul — design spec

Author: design-system-engineer (spec only, no page edits). Consumed by: `frontend-engineer`.
Reference audit: `nextjs.org/showcase` (landing pattern) and `nextjs.org/docs/app/getting-started/installation` (docs 3-col pattern), captured at 1440×900 and 390×844 via live DOM measurement (`getComputedStyle`/`getBoundingClientRect` — screenshots weren't retrievable in this sandbox, so every number below is a measured fact, not a guess).

Scope boundary: this spec covers `SiteNav`, `app/page.tsx` (landing), `app/docs/layout.tsx` + `DocsSidebar`/`DocsPagination`/`CodeBlock`, and the per-page docs prose pattern. `app/examples/*` keeps its existing 860px shell (not in scope — not mentioned in the task and it already reads fine as a narrow single-column reading surface). Accent-brand token family and the flat/border/no-shadow aesthetic are **not renegotiable** — every prescription below stays inside that budget.

---

## 0. Already fixed — the actual "font not applying" bug

`app/globals.css` `@theme inline` had:

```css
--font-sans: var(--font-sans);
```

A CSS custom property referencing **itself** resolves to the "guaranteed-invalid value" per spec — so `font-sans` (and `html { @apply font-sans; }` in `app/layout.tsx`'s `@layer base`) was silently falling back to the browser default font stack, not Geist. `--font-mono: var(--font-geist-mono)` was correct and always worked (this is why code blocks looked "fine" and body text didn't — it wasn't a loading problem, `next/font` was loading Geist correctly the whole time, it just never got applied to `html`/`body`).

Fixed in this pass:

```css
--font-sans: var(--font-geist-sans);
```

Now matches how `--font-mono` was already wired, and how `app/layout.tsx` names the variable (`Geist({ variable: "--font-geist-sans" })`). No other globals.css change is required for the font system — Geist Mono usage stays exactly where it already is (`CodeBlock`, inline `<code>`, the field-types table's `type` column) and should **not** spread to eyebrows/labels/kickers (see §1.4 — the reference doesn't do this either).

---

## 1. Typography system

### 1.1 Reference observations (cite before prescribing)

**nextjs.org/showcase (marketing/display type):**
| Element | Mobile (390px) | Desktop (1440px) |
|---|---|---|
| H1 (hero) | 32px / 600 / lh 40px / ls **‑1.28px** | 56px / 600 / lh 56px / ls **‑3.36px** |
| Hero paragraph | 18px / 400 / lh 28px | 20px / 400 / lh 36px, max-width 830px |
| Section H2 | — | 32px / 600 / ls ‑1.28px |
| Card grid gap / card size | 343×258 (~16px gutter) | 379×280, gap 16px, radius 6px, hairline border |
| Header height | 68px | 64px, `position: sticky`, opaque bg (no blur observed) |

Marketing type uses **aggressive negative tracking that scales with size** (~‑4% at 32px, ~‑6% at 56px) — tight tracking is a display-type technique, not applied to prose.

**nextjs.org/docs (prose/reading type), identical at 390px and 1440px — docs H1/body do NOT respond to breakpoint:**
| Element | Value |
|---|---|
| H1 | 36px / 600 / lh 61.2px (**1.7 ratio**) / letter-spacing **normal** |
| H2 | 24px / 600 / lh 40.8px (1.7 ratio) / normal |
| Body `<p>` | 16px / 400 / lh 27.2px (1.7 ratio) |
| Inline `<code>` | 14.4px, bg `rgb(247,247,247)` |
| Code block (`<pre>`) | Geist Mono, 13px, lh 20px, `rounded-md` (6px), hairline border, syntax-highlighted |
| Content column measure | **690px** |
| Left sidebar | 284px, links 14px/500 |
| Right "On this page" TOC | 224px (`w-56`), `lg:block` only (≥1024px) |
| Shell container | `max-w-(--ds-page-width)` ≈ 1377px at 1440 viewport, `px-6` (24px), `py-10` (40px) |
| Breadcrumb | present, visible at all breakpoints |

Key finding: **docs type does not scale down on mobile** — it's a fixed, generous, book-like reading scale, and its line-height (1.7) is dramatically looser than typical UI copy. Tracking is dead flat (0) in prose — tight tracking is reserved for display-only headlines.

### 1.2 Our current state (the gap)

- Landing H1 already steps 36/48/56px — **matches nextjs's proportions well**, just needs the tracking treatment (currently a flat `tracking-tight` utility, no per-breakpoint value).
- Landing subhead is **flat 15px at all 3 breakpoints** — this is the literal "no weight hierarchy" complaint: there's no responsive step at all on the one paragraph that should feel most "marketing."
- Docs H1 is **24px flat** (smaller than a nextjs section H2, let alone their docs H1 at 36px) — docs pages currently read as compact, dense reference material, not the airy long-form-reading experience the reference has.
- Docs body `<p>` is **14px flat with no explicit line-height** (Tailwind default ~1.5) vs reference's 16px/1.7.
- Docs content measure is **720px** — already close to the reference's 690px. **No change needed here.**
- Every docs page hand-rolls its own local `H2`/`P`/`IC` components with byte-identical Tailwind strings (confirmed across `conditions/page.tsx`, `installation/page.tsx`, `field-types/page.tsx`) — the sizes below must land in **every one of these**, or the pages will drift again immediately.

### 1.3 Prescription — Landing (display type, tight tracking, scales per breakpoint)

All values are exact px per breakpoint, triplicated per AGENTS.md convention — `frontend-engineer` transcribes directly, no new globals.css tokens needed (letter-spacing stays as inline arbitrary values, matching how `width`/`padding`/`radius` are already done in this codebase).

| Element | Mobile | Tablet | Desktop | Weight | Tracking (mobile/tablet/desktop) |
|---|---|---|---|---|---|
| Hero H1 | 36px | 48px | 56px | `font-semibold` (600) | `-1.2px` / `-2px` / `-3.4px` |
| Hero subhead `<p>` | 16px, lh 26px | 17px, lh 27px | 18px, lh 29px | 400 (default) | normal |
| Section H2 (all 4: "Try it right here", "Everything a real form needs", "How it compares", final CTA) | 24px | 28px | 32px | `font-semibold` | `-0.5px` / `-0.9px` / `-1.3px` |
| Section subhead `<p>` (under "Try it right here") | 14px (unchanged) | 14px | 14px | 400 | normal |

Implementation note: Tailwind arbitrary tracking is `tracking-[-1.2px] tablet:tracking-[-2px] desktop:tracking-[-3.4px]` — replace the current bare `tracking-tight` on H1/H2 elements in `app/page.tsx` with these per-breakpoint values. The hero subhead currently has `text-[15px] tablet:text-[15px] desktop:text-[15px]` (flat) — change to `text-[16px] tablet:text-[17px] desktop:text-[17px] desktop:text-[18px] leading-[26px] tablet:leading-[27px] desktop:leading-[29px]` (fix the actual step).

Do not apply negative tracking to body copy, card titles/descriptions, nav links, buttons, or table cells anywhere — tight tracking is a hero/section-heading-only technique per the reference.

### 1.4 Prescription — Docs (prose type, normal tracking, flat across breakpoints)

Docs prose does **not** need to scale per breakpoint the way the reference doesn't — but AGENTS.md still requires the triplicated-px form (repeat the same value at all 3 breakpoints is fine and matches how e.g. `DocsPagination`'s `text-[12px] tablet:text-[12px] desktop:text-[12px]` already does this for flat values).

| Element | Value (all breakpoints) | Weight | Tracking | Line-height |
|---|---|---|---|---|
| Docs H1 (page title) | 28px | `font-semibold` | normal (drop `tracking-tight`) | 36px |
| Docs H2 (section heading — the `H2` local component) | 19px | `font-semibold` | normal | 28px |
| Docs body `<p>` (the `P` local component) | 15px | 400 | normal | 25px (`leading-[25px]`, ~1.67 ratio, matching the reference's 1.7) |
| Docs small print (footer note, "Next:" links) | 13px (unchanged) | 400 | normal | default |
| Inline code (`IC`/ad-hoc `<code>`) | 13px (unchanged — already close to reference's 14.4px, no need to change) | 400 mono | — | — |
| Code block (`CodeBlock.tsx`) | 13px (up from 12.5px) | 400 mono | — | `leading-[20px]` (replace `leading-relaxed` with the explicit reference value) |

Rationale for landing at 28px (not nextjs's 36px): nextjs's docs H1 sits inside a much wider 690px+sidebar+toc shell where 36px reads proportionate; our docs pages are shorter reference material, and jumping from today's 24px straight to 36px would make the H1 visually louder than the landing page's own section H2 (32px desktop) one click away — 28px keeps the hierarchy honest (docs H1 28px < landing hero H1 56px, docs H1 28px sits just under landing section H2 32px, which is correct: docs is a sub-surface, not the flagship page) while still being a clear, deliberate step up from the current 24px.

**Action required beyond globals.css**: because `H2`/`P`/`IC` are copy-pasted per page, either (a) update the Tailwind strings in all 5 docs page files identically, or (b) — **recommended** — extract them once into a shared `components/docs/Prose.tsx` (`DocsH2`, `DocsBody`, `DocsInlineCode`) and import everywhere. Given AGENTS.md's DRY posture elsewhere in this codebase (`lib/docsNav.ts` exists specifically so two views "can't drift apart"), promoting these three components is in scope for `frontend-engineer` to decide, but is the second real duplication site (5 files) crossing the rule-of-three — recommend doing it now rather than hand-editing 5 files with the same risk of drift next time.

---

## 2. Container system

### 2.1 Reference observation

nextjs.org's outer `<body>` itself is capped at `max-width: 1440px` (centered) — everything else nests inside that as narrower sub-containers with their own measure:
- Header nav: **no additional cap**, spans the full 1440 shell with `px-*` padding only (edge-to-edge in practice below 1440px viewports).
- Showcase card grid: capped at **1200px**, `px-4` (16px) padding.
- Docs 3-column shell: capped at **~1377px** (`--ds-page-width`), `px-6` (24px), with sidebar (284) + content (690) + toc (224) fitting inside with gaps.

Ours currently uses one flat number, **1080px, everywhere** (`SiteNav`, landing, and — separately — docs at 1180px) with no differentiation between "the header" and "the content measure," and no room carved out for a docs TOC rail.

### 2.2 Prescription

| Surface | Mobile | Tablet | Desktop | Horizontal padding |
|---|---|---|---|---|
| `SiteNav` (all pages) | full-bleed | full-bleed | `max-w-[1280px]` (up from 1080) | `px-[16px] tablet:px-[24px] desktop:px-[32px]` (unchanged) |
| Landing (`app/page.tsx` content wrapper) | full-bleed | `max-w-[1080px]` (unchanged) | `max-w-[1200px]` (up from 1080) | unchanged |
| Docs shell (`app/docs/layout.tsx` outer wrapper) | `max-w-[1180px]` (unchanged) | `max-w-[1180px]` (unchanged) | `max-w-[1320px]` (up from 1180 — see §5 budget below) | unchanged |
| Docs content column (inner `max-w-[720px]` wrapper) | unchanged | unchanged | unchanged | — |

Why `SiteNav` gets its own (wider) number instead of matching the page it sits on: the reference's header isn't tied to any one page's content container at all (it just uses the outermost shell). Setting `SiteNav` to 1280px — the widest number any surface uses — means the header never looks narrower than the content beneath it on any page, which is the one thing that would look obviously wrong (a header that's visibly inset relative to a wider hero below it). `SiteNav` write-up is per AGENTS.md convention: same explicit value repeated at each breakpoint that should render it, `max-w-[1280px]` only takes effect ≥1025px since mobile/tablet content is already narrower than viewport.

Landing bump from 1080→1200 directly answers "currently 1080px everywhere" — 1200px is not an arbitrary round number, it's the exact measured width of nextjs's own showcase card grid container, and gives the new card grid (§4) room to breathe without seeming cropped.

Docs bump from 1180→1320 is sized to fit the new TOC rail (§5): `240` (sidebar) `+ 32` (gap) `+ 720` (content) `+ 32` (gap) `+ 216` (toc, see §5) `= 1240`, plus `2×32px` outer padding at desktop `= 1304`, round to `1320`. Verify this arithmetic against the real gap/padding values already in `app/docs/layout.tsx` (`gap-[40px]` desktop) when implementing — if the existing 40px desktop gap is kept between sidebar/content and a new 32px gap is added before the toc, recompute: `240 + 40 + 720 + 32 + 216 + 64(padding) = 1312`, so `max-w-[1320px]` still holds; if it doesn't land pixel-perfect, `frontend-engineer` should true up the number after actually laying it out — the specific value matters less than "wide enough for sidebar + 720px content + toc without the content column shrinking below 720."

---

## 3. `SiteNav` upgrade

### 3.1 Reference observation
Header: `position: sticky`, opaque background (not translucent — `rgb(255,255,255)` solid, no `backdrop-filter` measured on either surface), 64px desktop / 68px mobile height, hairline bottom border.

### 3.2 Prescription

Current `SiteNav` (`components/site/SiteNav.tsx`) uses `border-b border-border` (keep) but has no `sticky`, no explicit height (it's whatever `py-[14px]` + line-height produces, ~44-48px), and the wordmark is a plain 14px semibold link.

- **Sticky**: add `sticky top-0 z-40` to the `<header>`. The reference is opaque, not blurred — since our theme is dark-only with a page background that's already flat (`--background`), keep the header **opaque** (`bg-background`) rather than adding `backdrop-blur` + translucency. This is a deliberate deviation-from-trend call: translucent/blurred headers only read as "polished" when there's scrollable content with visual variance behind them (images, colorful cards); our sections are flat bordered cards on a single flat background, so blur would add cost (a new CSS feature, GPU compositing layer) for zero visible benefit over solid `bg-background`. If a future page introduces bg imagery behind the fold, revisit.
- **Height**: `py-[14px] tablet:py-[16px] desktop:py-[18px]` → yields ~48px/52px/56px nav row height including the 14px link line-height — close enough to the reference's 64px without demanding a taller logo lockup we don't have. (Do not literally chase 64px with empty padding — that would just be dead air around a 14px wordmark; scale the wordmark up too, next bullet.)
- **Wordmark**: bump from flat `text-[14px]` to `text-[15px] tablet:text-[16px] desktop:text-[16px] font-semibold tracking-tight` — small step, but the current 14px reads the same size as the nav *links* next to it, so "Form Builder" doesn't register as the brand mark. Keep it text-only (no logo asset exists — do not invent one).
- **Nav links** (`NavLinks.tsx`): unchanged sizing (13px) is fine and matches the reference's understated nav-link treatment; keep the existing `aria-current` + underline-on-active-via-border pattern, it already matches accessible-link conventions.
- **Skip link**: unchanged — already correct (`sr-only focus:not-sr-only`), keep exactly as-is.

---

## 4. Landing restructure

Map the showcase *pattern* (hero → filterable/browsable card grid → footer) onto **our actual content** — do not invent screenshots, customer logos, or categories we don't have.

### 4.1 What stays, what changes, final order

1. **Hero** (stays, retyped per §1.3). No structural change — headline, subhead, two CTAs (`Open the builder` / `Read the docs`) is already the right shape and matches the reference's hero→two-CTA pattern closely enough as-is.
2. **NEW — showcase-style card grid** (replaces nothing, inserted as the new #2, pushing "Try it right here" down): our answer to the reference's site-grid. Four cards — the three `/examples/*` pages plus `/builder` — styled as visual link-cards:
   - Grid: `grid-cols-1 tablet:grid-cols-2 desktop:grid-cols-4 gap-[16px] tablet:gap-[16px] desktop:gap-[16px]` (reference used `gap-[16px]` at both breakpoints measured — reuse that exact value, it's already load-bearing in this codebase's own feature grid at line 178 of `app/page.tsx`).
   - Card shape: `rounded-[12px] border border-border-interactive bg-card p-[20px] hover:border-border-interactive-hover focus-visible:border-foreground` — reuse the exact interactive-card pattern already established in `app/examples/page.tsx` and `app/docs/page.tsx` (`border-border-interactive`, not `border-border` — those two tokens exist specifically for link-shaped cards, see the WCAG contrast comment block in `globals.css`). Do not invent a new card treatment.
   - Card content per card (data-driven, not free text): title (e.g. "Multi-step signup"), one-line description (reuse the exact strings already written in `app/examples/page.tsx`'s `EXAMPLES` array and `app/builder`'s own copy — do not write new marketing copy, pull from source of truth), and a small category-style label matching the reference's card category chips (e.g. "Wizard", "Conditions", "Advanced fields", "Builder") — this is new copy `frontend-engineer` should keep to one or two words, styled as `text-[11px] font-medium uppercase tracking-wide text-muted-foreground` (same treatment already used for the comparison table's column labels at line 205 of `app/page.tsx` — reuse, don't invent a new "kicker" style).
   - **No screenshots/mini-embeds**: the reference's cards are literal site screenshots (external, static images they control). We don't have that and shouldn't fake it. Instead, reuse the existing "styled preview panel" idiom already established two sections down in the current file (the `aria-hidden` dashed-border builder-canvas mock with fake field chips, lines 150-163) — give each of the 4 cards a small non-interactive visual placeholder in that same idiom (e.g. 2-3 skeleton "field row" bars for the form examples, and the existing chip-list mock reused specifically for the `/builder` card since that's literally what it already represents). Keep every placeholder `aria-hidden="true"` since it's decorative, exactly as the current mock already does.
3. **Live demo** ("Try it right here") — stays, unchanged content, just retyped H2 per §1.3.
4. **Builder ↔ code split** — stays, unchanged.
5. **Feature grid** ("Everything a real form needs") — stays, unchanged.
6. **Comparison strip** ("How it compares") — stays, unchanged.
7. **Final CTA** — stays, unchanged.

This is additive (one new section) plus retyping existing sections — no section is deleted, because every existing section already earns its place and none of them duplicate what the new card grid does (the new grid is a *navigation* surface — "here's what you can go look at" — distinct from the live-embedded demo, which is a *proof* surface — "here's the engine actually running").

### 4.2 Card grid sizing (per-breakpoint px, for direct transcription)

```
Grid:  grid-cols-1 tablet:grid-cols-2 desktop:grid-cols-4
       gap-[16px] tablet:gap-[16px] desktop:gap-[16px]
Card:  rounded-[12px] tablet:rounded-[12px] desktop:rounded-[12px]
       border border-border-interactive bg-card
       p-[20px] tablet:p-[20px] desktop:p-[20px]
       flex flex-col gap-[12px] tablet:gap-[12px] desktop:gap-[12px]
Preview placeholder area:
       rounded-[8px] border border-dashed border-border
       h-[96px] tablet:h-[96px] desktop:h-[96px] (fixed, so all 4 cards align)
Kicker: text-[11px] font-medium uppercase tracking-wide text-muted-foreground
Title:  text-[15px] tablet:text-[15px] desktop:text-[15px] font-medium text-card-foreground
Desc:   text-[13px] tablet:text-[13px] desktop:text-[13px] text-muted-foreground
```

Section heading above the grid: reuse the existing pattern from "Everything a real form needs" — `text-center` H2 per §1.3 sizing, e.g. "See it in action" or similar (copy call left to `frontend-engineer`/`product-engineer`, not a design-system concern).

---

## 5. Docs 3-column layout

### 5.1 Right "On this page" TOC rail (new)

Reference: 224px (`w-56`), desktop-only (`lg:block`, i.e. our `desktop:` breakpoint), sticky, built from real `id`s on `h2` elements in the page.

**Approach — static per-page heading lists, not DOM extraction.** Every docs page already hand-writes its `H2` local component calls inline (see `conditions/page.tsx` — `<H2>visibleWhen, disabledWhen, enabledWhen</H2>`, `<H2>Condition shape</H2>`, etc.). Extracting headings from the rendered DOM at runtime (e.g. `querySelectorAll('h2')` + `IntersectionObserver` for scroll-spy) is exactly the kind of dynamic complexity this repo's own conventions avoid elsewhere (cf. `lib/docsNav.ts`'s comment about being a single static source of truth). Instead:

1. Give each docs page a co-located `toc.ts` (or a `TOC_ITEMS` const at the top of `page.tsx`, matching how `conditions/page.tsx` already keeps its code-sample consts at the top) — a plain array of `{ id: string; title: string }` in the same order the `H2`s appear.
2. The shared `H2` prose component (§1.4's proposed `DocsH2`/`Prose.tsx` extraction) takes an optional `id` prop and renders it onto the heading (`<h2 id={id}>`), so anchor targets exist without a runtime DOM walk.
3. A new `components/docs/DocsToc.tsx` client component (needs `usePathname` for active-section styling, matching the existing `DocsSidebar`/`DocsPagination` client-leaf pattern) takes `items: TOC_ITEMS` as a prop from each page and renders the sticky rail. Active-section highlighting can be scroll-based (`IntersectionObserver` watching each `id`'s element, one observer instance, cleaned up on unmount) — this is the one piece of unavoidable runtime DOM interaction, scoped narrowly to "which section is in view," not "what sections exist."
4. Pages without enough headings to be worth a TOC (none currently — all 5 content pages have 3+ `H2`s) can pass an empty array and `DocsToc` renders `null`, same null-guard pattern already used in `DocsPagination`.

This keeps the source-of-truth-per-page property the rest of the docs system already has (`DOCS_NAV_GROUPS` for the sidebar/pagination, now `TOC_ITEMS` per page for the toc) rather than introducing MDX or a heading-extraction build step — no new dependency, consistent with the "no new deps" constraint.

**Sizing** (desktop-only, matches reference `w-56`):
```
nav:  hidden desktop:sticky desktop:top-[80px] desktop:block
      desktop:w-[216px] desktop:shrink-0 desktop:self-start
      desktop:py-[48px]
Heading label ("On this page"):
      desktop:text-[11px] font-medium uppercase tracking-wide text-muted-foreground
Links:
      desktop:block desktop:py-[4px] desktop:text-[13px]
      border-l-2 desktop:pl-[12px]
      (active: border-foreground text-foreground font-medium;
       inactive: border-transparent text-muted-foreground hover:text-foreground)
```
216px (not literally 224px) — sized to make the container arithmetic in §2.2 work cleanly; functionally identical to the reference's 224px, the 8px difference is immaterial.

`desktop:top-[80px]` (not `desktop:top-[32px]` like the existing `DocsSidebar`'s sticky offset) accounts for the new sticky `SiteNav` header (§3) now actually occupying scroll-fixed space above it — recompute this offset against the real rendered header height once §3 lands; the number must be ≥ the sticky header's height or the TOC will render underneath it on scroll.

### 5.2 Sidebar refinements

`DocsSidebar.tsx`'s existing structure (grouped, sticky, `border-l-2` active indicator) already closely matches the reference's pattern (284px wide grouped nav with `aria-current` active states) — **keep the component as-is structurally**. Only change:
- Sticky offset: same `top-[32px]` → needs the same header-height reconciliation as §5.1 (both rails must use the same sticky offset once §3's header is sticky — currently neither rail accounts for a sticky header because the header isn't sticky yet).
- Width: keep 240px (reference is 284px but our sidebar item labels are shorter — "Installation," "Your first form" — 240px isn't cramped; don't force a bump just to match the reference number when our content doesn't need it).

### 5.3 Breadcrumbs

Reference has them; visible at all breakpoints. We don't have any today. Given the sidebar is already grouped (Overview / Getting started / Concepts / Reference) and pagination already exists, a breadcrumb (`Docs / Concepts / Conditions`) adds a small but real orientation win, especially on mobile where the sidebar collapses to a horizontal scroll row and a user who's scrolled sideways loses the group context.

Prescription: new one-line breadcrumb above the H1, using `DOCS_NAV_GROUPS` (already know which group a page belongs to — zero new data needed):
```
text-[12px] tablet:text-[12px] desktop:text-[12px] text-muted-foreground
"Docs" (link) / group.title (not a link) / page.title (current, text-foreground)
separators: "/" text-muted-foreground, or a small ChevronRight icon (size-[12px]) — either is fine, pick whichever is already used elsewhere in this codebase for consistency (check lucide-react usage in app/page.tsx first before adding a new visual separator convention).
```
Implement once in `app/docs/layout.tsx` (above `{children}`, alongside where `DocsPagination` is rendered below it) driven by `pathname` + `DOCS_NAV_GROUPS`, not per-page — same "can't drift" argument as everything else in `lib/docsNav.ts`.

### 5.4 Prose typography application

Apply §1.4's sizes to the shared `H2`/`P`/`IC` (or their `Prose.tsx` extraction) and to each page's standalone `<h1>` — these are currently inlined per-page with `text-[24px] ... font-semibold tracking-tight`; per §1.4, drop `tracking-tight` (docs prose is normal-tracking) and bump to `text-[28px]` with `leading-[36px]`.

### 5.5 `CodeBlock.tsx` polish

Per §1.4: bump `text-[12.5px]` → `text-[13px]` (all 3 breakpoints) and replace `leading-relaxed` with explicit `leading-[20px]` (all 3 breakpoints), matching the reference's measured code-block line-height exactly. No syntax highlighting (explicitly out of scope — "no new dependencies," and the file's own comment already documents this as a deliberate Phase-1 choice). Everything else in this file (`rounded-[10px]`, `border-border`, `bg-muted`, the `tabIndex`/`aria-label` scrollable-region accessibility treatment, `dir="ltr"`) is already correct and untouched.

### 5.6 Prev/next pagination cards

`DocsPagination.tsx` already uses the correct `border-border-interactive` card idiom and correct label/title type scale relationship (12px label / 14px title) — no changes needed here; it was already built to the pattern the rest of this spec is asking for elsewhere.

---

## 6. Full per-breakpoint px reference table

For direct transcription into Tailwind arbitrary values. "—" means unchanged from current implementation.

| Token | Mobile | Tablet | Desktop |
|---|---|---|---|
| **Landing hero H1** size | 36 | 48 | 56 |
| Landing hero H1 tracking | ‑1.2 | ‑2 | ‑3.4 |
| Landing hero subhead size / lh | 16 / 26 | 17 / 27 | 18 / 29 |
| Landing section H2 size | 24 | 28 | 32 |
| Landing section H2 tracking | ‑0.5 | ‑0.9 | ‑1.3 |
| **Docs H1** size / lh | 28 / 36 | 28 / 36 | 28 / 36 |
| Docs H2 size / lh | 19 / 28 | 19 / 28 | 19 / 28 |
| Docs body P size / lh | 15 / 25 | 15 / 25 | 15 / 25 |
| Docs inline code size | 13 | 13 | 13 |
| CodeBlock size / lh | 13 / 20 | 13 / 20 | 13 / 20 |
| **SiteNav** height (py) | 14 | 16 | 18 |
| SiteNav wordmark size | 15 | 16 | 16 |
| SiteNav max-width | full | full | 1280 |
| **Landing container** max-width | full | 1080 | 1200 |
| **Docs shell** max-width | 1180 | 1180 | 1320 |
| Docs content column | 720 | 720 | 720 |
| Docs sidebar width | — | — | 240 |
| Docs TOC width (new) | n/a | n/a | 216 |
| New card grid gap | 16 | 16 | 16 |
| New card grid cols | 1 | 2 | 4 |
| New card padding | 20 | 20 | 20 |
| New card radius | 12 | 12 | 12 |
| New card preview height | 96 | 96 | 96 |

---

## 7. globals.css changes made in this pass

Only the font-sans fix (§0) — no new tokens were needed. Every other value in this spec is a per-breakpoint Tailwind arbitrary value applied at the component level, consistent with AGENTS.md's explicit instruction not to collapse the triplicated-px pattern back into shared tokens/rem-scale utilities.

```diff
   --color-background: var(--background);
   --color-foreground: var(--foreground);
-  --font-sans: var(--font-sans);
+  --font-sans: var(--font-geist-sans);
   --font-mono: var(--font-geist-mono);
   --font-heading: var(--font-sans);
```

---

## 8. Handoffs

- **`frontend-engineer`**: implement §1–§6 across `SiteNav.tsx`, `app/page.tsx`, `app/docs/layout.tsx`, `DocsSidebar.tsx`, all 5 `app/docs/*/page.tsx` files, `CodeBlock.tsx`; build the new `DocsToc.tsx` + per-page `TOC_ITEMS`; decide on and (recommended) execute the `Prose.tsx` extraction (§1.4) rather than hand-editing 5 files with byte-identical strings a 6th time.
- **`accessibility-engineer`**: verify the new TOC rail's scroll-spy doesn't fight focus order (rail should not be a focus trap, active-state should be visual-only + optionally `aria-current` on the in-view link, not an automatic-focus-steal); verify new breadcrumb's `nav aria-label`; verify the 4 new landing cards' `aria-hidden` preview placeholders don't leak decorative content into the accessible name of the card link (each card is one `<a>` wrapping a heading + description + decorative div — confirm the accessible name resolves to just the title, matching the existing `/examples` and `/docs` index card pattern already in this codebase).
- **`performance-engineer`**: the new `DocsToc` `IntersectionObserver` is the only new runtime cost in this spec — confirm one observer instance shared across all watched headings (not one per heading) and that it's torn down on route change (existing `usePathname`-based client components in this codebase, e.g. `DocsSidebar`, are already Client Components for the same reason, so this fits the existing boundary rather than adding a new one).
