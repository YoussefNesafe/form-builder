---
name: ui-responsive-breakpoints
description: Use when adding or editing Tailwind classes in any UI file of this repo — components/ui/*, form-builder/ui|fields|components/*, app/* pages — for sizing, spacing, typography, radius, icon size, or responsive behavior, or when setting field widths/column spans.
---

# UI Responsive Breakpoints (3-Breakpoint Triplicated-px System)

## Overview

This repo uses a custom 3-breakpoint system with every size utility written as a px arbitrary value and **triplicated** across all three breakpoints. The values are identical today on purpose — scaffolding so each breakpoint can be tuned independently later without hunting classes.

**Violating the letter of this convention is violating its spirit.** Do not "clean up" the duplication.

## Breakpoints

| Breakpoint | Prefix | Min width | Source |
|---|---|---|---|
| mobile | (none, base) | 0 | default |
| tablet | `tablet:` | 481px | `app/globals.css` `@theme` `--breakpoint-tablet` |
| desktop | `desktop:` | 1025px | `app/globals.css` `@theme` `--breakpoint-desktop` |

**NEVER use `sm:`, `md:`, `lg:`, `xl:`, `2xl:`.** They were deliberately remapped out of this codebase.

## The Triplication Rule

Every utility that carries a size (height, width, padding, margin, gap, font-size, radius, ring width, icon size, translate, min/max dimensions) appears three times: base + `tablet:` + `desktop:`.

```tsx
// ✅ Correct
"h-[32px] tablet:h-[32px] desktop:h-[32px] px-[10px] tablet:px-[10px] desktop:px-[10px] text-[14px] tablet:text-[14px] desktop:text-[14px] rounded-[10px] tablet:rounded-[10px] desktop:rounded-[10px]"

// ❌ Wrong: rem-scale utilities
"h-8 px-2.5 text-sm rounded-md"

// ❌ Wrong: single px value, not triplicated
"h-[32px] px-[10px]"

// ❌ Wrong: standard Tailwind breakpoints
"p-[12px] sm:p-[16px] lg:p-[20px]"
```

Modifier stacks triplicate too — the breakpoint prefix goes FIRST:

```tsx
"[&_svg:not([class*='size-'])]:size-[16px] tablet:[&_svg:not([class*='size-'])]:size-[16px] desktop:[&_svg:not([class*='size-'])]:size-[16px]"
"focus-visible:ring-3 tablet:focus-visible:ring-3 desktop:focus-visible:ring-3"
```

Non-size utilities (colors, flex/grid keywords, `font-medium`, `whitespace-nowrap`, state variants without a size) are NOT triplicated — write them once.

When values genuinely differ per breakpoint, same shape, different numbers:

```tsx
"px-[12px] py-[10px] tablet:px-[16px] tablet:py-[12px] desktop:px-[20px] desktop:py-[14px]"
```

## Field Widths (12-column grid)

Field configs take `width?: ResponsiveFieldWidth` — `"full" | "half" | "third" | "quarter"` or `{ mobile?, tablet?, desktop? }`. Resolve with `fieldWidthClass()` from `form-builder/ui/variants.ts`; never hand-write `col-span-*` for fields.

- Spans: full=12, half=6, third=4, quarter=3 (grid is `FLAT_GRID_CLASS` in `form-builder/ui/layout.ts`).
- Unset breakpoints fall back to **full** — they do NOT cascade up from mobile. By design.
- cva variants use one key per breakpoint (`width`, `widthTablet`, `widthDesktop`) because cva has no responsive-variant support.

## Portable-package sizing tokens (`form-builder/**` ONLY)

Files under `form-builder/**` wrap every vw size literal as a CSS-var reference with the literal as its fallback — this is the consumer override seam (approach #1) so a host copying the package can retheme sizing in any unit. **App-owned UI outside the package** (`components/ui`, `components/builder`, `components/home`, `app/**`) stays on bare triplicated literals — do NOT wrap those.

```tsx
// ✅ inside form-builder/** — var(--fb-space-N[-tier], <literal>), triplicated
"gap-[var(--fb-space-3,1.602vw)] tablet:gap-[var(--fb-space-3-tablet,0.75vw)] desktop:gap-[var(--fb-space-3-desktop,0.312vw)]"

// ❌ bare literal inside form-builder/** — drops the override seam
"gap-[1.602vw] tablet:gap-[0.75vw] desktop:gap-[0.312vw]"
```

Rules when adding/editing size classes in `form-builder/**`:
- **Fallback = the exact literal.** Parity is by construction; never change the fallback to alter a size — override the token (or pick a different step) instead.
- **Triplication preserved.** One `var()` per breakpoint; tiers are independent tokens: `--fb-space-N` (mobile/base), `--fb-space-N-tablet`, `--fb-space-N-desktop`. Never collapse to a single class.
- **Numeric length scale, reuse steps.** step = `tablet-vw / 0.25` (so mobile = step×0.534vw, desktop = step×0.104vw). Match an existing step; don't invent semantic names. Defaults + the full step list live in `form-builder/theme/tokens.css`.
- **Class stays a static literal.** Only the CSS-var *value* is dynamic (resolved at paint) — the class name itself is still fully static, so no `` `[var(--x-${n})]` ``.

## cva / Tailwind Constraints

- Class strings must be **static literals**. Tailwind cannot see built strings — no `` `tablet:h-[${h}px]` ``, no `"tablet:" + cls`.
- Flat style is user-mandated: states via border color only, no shadows/rings for emphasis (`FLAT_GRID_CLASS` context).

## Checklist Before Finishing a UI Edit

1. Grep your new code for `sm:|md:|lg:` → must be zero (except `max-sm` etc. never used here anyway).
2. Grep for rem-scale sizes (`text-sm`, `p-4`, `gap-2`, `rounded-md`, `size-4`, `h-9`...) → convert to px arbitrary values.
3. Every size utility appears 3×: base, `tablet:`, `desktop:`.
4. Field spans go through `fieldWidthClass`, not raw `col-span-*`.
5. Editing a file under `form-builder/**`? Every vw size is `var(--fb-space-N[-tier], <literal>)`, not a bare `[Nvw]`. (App UI outside the package stays bare.)

## Common Mistakes

| Mistake | Reality |
|---|---|
| "Values are identical — dedupe to one class" | Duplication is deliberate scaffolding for per-breakpoint tuning. Keep all three. |
| "`text-sm` is idiomatic Tailwind" | Not here. rem-scale utilities were migrated out in commit 9ab3ea0. Use `text-[14px]` triplicated. |
| "`md:` maps roughly to tablet" | Wrong breakpoint values and dead prefix here. Use `tablet:` (481px) / `desktop:` (1025px). |
| "Build class names dynamically to avoid repetition" | Tailwind JIT can't see them; styles silently vanish. Static strings only. |
| "colSpan prop" | Removed. Use `width` (`ResponsiveFieldWidth`) + `fieldWidthClass`. |

Reference exemplar: `components/ui/button.tsx` (canonical triplicated cva) and `form-builder/ui/variants.ts` (width variants).
