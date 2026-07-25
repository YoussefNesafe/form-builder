# Logo / Brand Identity Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ship one logo system (mark + wordmark) across the site, favicon, social card, app icons, and npm — from a single set of source SVGs.

**Architecture:** Hand-authored master SVGs in `public/brand/` are the source of truth. The mark = periwinkle code-braces `{ }` around stacked, unequal-width form-field rows; braces are a fixed hue, rows use `currentColor` for light/dark parity. A theme-adaptive 2-row variant becomes `app/icon.svg`. A single Node script (`sharp`) rasterizes every PNG deliverable (favicon fallback, apple-icon + npm-avatar tiles, wordmark). The site consumes the mark through one React component; the OG image is edited in place.

**Tech Stack:** SVG (hand-authored), React 19 / Next 16 App Router file-convention icons, `sharp` (already resolvable) for PNG generation, `next/og` (existing) for the OG card, vitest for the two genuine assertions.

**Design doc:** `docs/plans/2026-07-26-logo-brand-identity-design.md` (approved).

**Conventions (repo-specific — do not violate):**
- Flat only: stroke/fill, never shadow/gradient/ring.
- On-site Tailwind sizing is triplicated per breakpoint (`text-[Xvw] tablet:text-[Yvw] desktop:text-[Zvw]`); never collapse. See `.claude/skills/ui-responsive-breakpoints`.
- Brand hue periwinkle `#7f98f5`; bg `#0a0a0a`; fg `#fafafa`.
- Inline SVGs use `viewBox` + `aria-hidden` (mirror the GitHub icon in `SiteNav.tsx`).

---

## Task 1: Master mark SVG

**Files:**
- Create: `public/brand/logo-mark.svg`

**Step 1: Write the SVG**

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" role="img" aria-label="Form Builder">
  <!-- code braces: fixed brand hue -->
  <g stroke="#7f98f5" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <path d="M8.5 4.5C6.8 4.5 6.8 6 6.8 7.8C6.8 10.2 5.6 10.8 4.4 12C5.6 13.2 6.8 13.8 6.8 16.2C6.8 18 6.8 19.5 8.5 19.5"/>
    <path d="M15.5 4.5C17.2 4.5 17.2 6 17.2 7.8C17.2 10.2 18.4 10.8 19.6 12C18.4 13.2 17.2 13.8 17.2 16.2C17.2 18 17.2 19.5 15.5 19.5"/>
  </g>
  <!-- form field rows: adapt to surrounding text color -->
  <g fill="currentColor">
    <rect x="9" y="7.6"  width="6"   height="1.7" rx="0.85"/>
    <rect x="9" y="11.15" width="3.9" height="1.7" rx="0.85"/>
    <rect x="9" y="14.7" width="4.9" height="1.7" rx="0.85"/>
  </g>
</svg>
```

**Step 2: Verify it renders**

Run: `yarn dev`, open `http://localhost:3000/brand/logo-mark.svg`.
Expected: two periwinkle braces hugging three black bars (black because no color context — `currentColor` falls back to black; correct). No console errors. Stop `dev`.

**Step 3: Commit**

```bash
git add public/brand/logo-mark.svg
git commit -m "feat(brand): master logo mark svg (braces + field rows)"
```

---

## Task 2: Theme-adaptive favicon (`app/icon.svg`) + drop the stock favicon

**Files:**
- Create: `app/icon.svg`
- Delete: `app/favicon.ico` (the Next default; replaced)

**Step 1: Write the 2-row adaptive icon**

`currentColor` is unreliable for a browser tab (no CSS context), so this variant sets explicit colors and flips them with `prefers-color-scheme`. 2 rows + heavier strokes so it holds at 16px.

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
  <style>
    .row { fill: #0a0a0a; }
    @media (prefers-color-scheme: dark) { .row { fill: #fafafa; } }
  </style>
  <g stroke="#7f98f5" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M8.5 4.5C6.8 4.5 6.8 6 6.8 7.8C6.8 10.2 5.6 10.8 4.4 12C5.6 13.2 6.8 13.8 6.8 16.2C6.8 18 6.8 19.5 8.5 19.5"/>
    <path d="M15.5 4.5C17.2 4.5 17.2 6 17.2 7.8C17.2 10.2 18.4 10.8 19.6 12C18.4 13.2 17.2 13.8 17.2 16.2C17.2 18 17.2 19.5 15.5 19.5"/>
  </g>
  <g class="row">
    <rect x="9" y="8.4"  width="6"   height="2.3" rx="1.15"/>
    <rect x="9" y="13.3" width="4.2" height="2.3" rx="1.15"/>
  </g>
</svg>
```

**Step 2: Remove the stock favicon**

Run: `git rm app/favicon.ico`
(Next serves `app/icon.svg` as `<link rel="icon">`; Task 5 adds a `.png` fallback for legacy browsers.)

**Step 3: Verify Next emits the icon link**

Run: `yarn build` then `yarn start`; view page source at `/`.
Expected: build succeeds; `<head>` contains a `<link rel="icon" ... type="image/svg+xml">` pointing at `/icon.svg`. Tab shows the braces mark. Stop server.

**Step 4: Commit**

```bash
git add app/icon.svg
git rm app/favicon.ico
git commit -m "feat(brand): theme-adaptive favicon, drop stock favicon.ico"
```

---

## Task 3: `Logo` React component (mark + optional wordmark)

Single component the whole site uses. Mark is inline SVG (so `currentColor` inherits text color); wordmark is live Geist text (already loaded in `app/layout.tsx`).

**Files:**
- Create: `components/brand/Logo.tsx`
- Create (test): `components/brand/Logo.test.tsx`

**Step 1: Write the failing test**

```tsx
import { render, screen } from "@testing-library/react";
import { Logo } from "./Logo";

describe("Logo", () => {
  it("renders an accessible mark by default", () => {
    render(<Logo />);
    expect(screen.getByRole("img", { name: /form builder/i })).toBeTruthy();
  });

  it("renders the wordmark text when asked", () => {
    render(<Logo withWordmark />);
    expect(screen.getByText("Form Builder")).toBeTruthy();
  });
});
```

**Step 2: Run it, expect failure**

Run: `yarn test components/brand/Logo.test.tsx`
Expected: FAIL — `Cannot find module './Logo'`.

**Step 3: Implement the component**

Braces `#7f98f5`, rows `currentColor`. `size-*` classes triplicated per the responsive convention. Wordmark uses `t.nav.brand`.

```tsx
import { cn } from "@/lib/utils";
import { t } from "@/locales";

export function Logo({
  withWordmark = false,
  className,
}: {
  withWordmark?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-[2.136vw] tablet:gap-[1vw] desktop:gap-[0.416vw]", className)}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        role="img"
        aria-label={withWordmark ? undefined : t.nav.brand}
        aria-hidden={withWordmark ? true : undefined}
        className="size-[6.408vw] tablet:size-[3vw] desktop:size-[1.248vw]"
      >
        <g stroke="#7f98f5" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8.5 4.5C6.8 4.5 6.8 6 6.8 7.8C6.8 10.2 5.6 10.8 4.4 12C5.6 13.2 6.8 13.8 6.8 16.2C6.8 18 6.8 19.5 8.5 19.5" />
          <path d="M15.5 4.5C17.2 4.5 17.2 6 17.2 7.8C17.2 10.2 18.4 10.8 19.6 12C18.4 13.2 17.2 13.8 17.2 16.2C17.2 18 17.2 19.5 15.5 19.5" />
        </g>
        <g fill="currentColor">
          <rect x="9" y="7.6" width="6" height="1.7" rx="0.85" />
          <rect x="9" y="11.15" width="3.9" height="1.7" rx="0.85" />
          <rect x="9" y="14.7" width="4.9" height="1.7" rx="0.85" />
        </g>
      </svg>
      {withWordmark && (
        <span className="text-[4.005vw] tablet:text-[2vw] desktop:text-[0.832vw] font-semibold tracking-tight text-foreground">
          {t.nav.brand}
        </span>
      )}
    </span>
  );
}
```

**Step 4: Run the test, expect pass**

Run: `yarn test components/brand/Logo.test.tsx`
Expected: PASS (both cases).

**Step 5: Commit**

```bash
git add components/brand/Logo.tsx components/brand/Logo.test.tsx
git commit -m "feat(brand): Logo component (mark + optional Geist wordmark)"
```

---

## Task 4: Use `Logo` in `SiteNav`

**Files:**
- Modify: `components/site/SiteNav.tsx:26-31` (the brand `<Link>`)

**Step 1: Swap the text brand for the lockup**

Replace the inner text of the brand `<Link>` (currently `{t.nav.brand}`) with `<Logo withWordmark />`, and drop the now-duplicated `text-*`/`font-semibold`/`tracking-tight`/`text-foreground` classes from the `<Link>` (keep the focus-border classes):

```tsx
import { Logo } from "@/components/brand/Logo";
// ...
<Link
  href="/"
  aria-label={t.nav.brand}
  className="inline-flex border-b border-transparent focus-visible:border-foreground focus-visible:outline-none"
>
  <Logo withWordmark />
</Link>
```

**Step 2: Verify visually**

Run: `yarn dev`, open `/`.
Expected: nav shows the periwinkle-brace mark left of "Form Builder"; mark rows are near-white (inherit `text-foreground`). Keyboard-focus the link → underline still appears. Stop `dev`.

**Step 3: Run the full test + lint**

Run: `yarn test && yarn lint`
Expected: PASS, no lint errors.

**Step 4: Commit**

```bash
git add components/site/SiteNav.tsx
git commit -m "feat(brand): render Logo lockup in SiteNav"
```

---

## Task 5: PNG asset-generation script (`sharp`)

One script rasterizes every PNG: legacy favicon fallback, apple-icon (tile), npm avatar (tile), and the wordmark. Tiles are rounded periwinkle only for the two standalone app-icon contexts (design-doc rule).

**Files:**
- Create: `scripts/build-brand-assets.mjs`
- Create (outputs, git-tracked): `app/icon.png`, `app/apple-icon.png`, `public/brand/logo-512.png`, `public/brand/logo-wordmark.png`
- Modify: `package.json` (add script entry)

**Step 1: Write the generator**

Rasterizes the master mark onto transparent/tiled backgrounds and composites a system-sans wordmark (crisp enough for README/npm; the *site* wordmark stays live Geist from Task 3). `sharp` resolves at `node_modules/sharp/dist/index.cjs`.

```js
// scripts/build-brand-assets.mjs
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";

const ROOT = process.cwd();
const PERIWINKLE = "#7f98f5";

// Mark as a standalone SVG string, parametrized by row color (no currentColor at raster time).
const mark = (rowColor) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
  <g stroke="${PERIWINKLE}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <path d="M8.5 4.5C6.8 4.5 6.8 6 6.8 7.8C6.8 10.2 5.6 10.8 4.4 12C5.6 13.2 6.8 13.8 6.8 16.2C6.8 18 6.8 19.5 8.5 19.5"/>
    <path d="M15.5 4.5C17.2 4.5 17.2 6 17.2 7.8C17.2 10.2 18.4 10.8 19.6 12C18.4 13.2 17.2 13.8 17.2 16.2C17.2 18 17.2 19.5 15.5 19.5"/>
  </g>
  <g fill="${rowColor}">
    <rect x="9" y="7.6" width="6" height="1.7" rx="0.85"/>
    <rect x="9" y="11.15" width="3.9" height="1.7" rx="0.85"/>
    <rect x="9" y="14.7" width="4.9" height="1.7" rx="0.85"/>
  </g>
</svg>`;

// Rounded periwinkle tile with a white-row mark centered (app-icon look).
const tile = (px) => {
  const r = Math.round(px * 0.22);
  const inset = Math.round(px * 0.2);
  const inner = px - inset * 2;
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="0 0 ${px} ${px}">
  <rect width="${px}" height="${px}" rx="${r}" fill="#0a0a0a"/>
  <g transform="translate(${inset} ${inset})">
    <svg width="${inner}" height="${inner}" viewBox="0 0 24 24">${mark("#fafafa").replace(/<\/?svg[^>]*>/g, "")}</svg>
  </g>
</svg>`;
};

const wordmark = () => {
  const H = 120, markBox = 96, pad = 12, textX = markBox + 28;
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="520" height="${H}" viewBox="0 0 520 ${H}">
  <g transform="translate(${pad} ${(H - markBox) / 2})">
    <svg width="${markBox}" height="${markBox}" viewBox="0 0 24 24">${mark("#0a0a0a").replace(/<\/?svg[^>]*>/g, "")}</svg>
  </g>
  <text x="${textX}" y="${H / 2}" dominant-baseline="central"
        font-family="Geist, Inter, Arial, sans-serif" font-weight="600"
        font-size="52" letter-spacing="-1" fill="#0a0a0a">Form Builder</text>
</svg>`;
};

async function png(svg, outRel, size) {
  const out = join(ROOT, outRel);
  await mkdir(dirname(out), { recursive: true });
  let img = sharp(Buffer.from(svg));
  if (size) img = img.resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } });
  await img.png().toFile(out);
  console.log("wrote", outRel);
}

await png(mark("#0a0a0a"), "app/icon.png", 32);            // legacy favicon fallback
await png(tile(180), "app/apple-icon.png");                 // iOS home screen
await png(tile(512), "public/brand/logo-512.png");          // npm org avatar
await png(wordmark(), "public/brand/logo-wordmark.png");    // README / marketing
```

**Step 2: Add the package script**

In `package.json` `scripts`, add:
```json
"brand:assets": "node scripts/build-brand-assets.mjs"
```

**Step 3: Run it**

Run: `yarn brand:assets`
Expected: four `wrote ...` lines, no errors. Files exist:
Run: `ls -la app/icon.png app/apple-icon.png public/brand/logo-512.png public/brand/logo-wordmark.png`

**Step 4: Sanity-check dimensions**

Run: `node -e "import('sharp').then(async ({default:s})=>{for(const f of ['app/apple-icon.png','public/brand/logo-512.png']){const m=await s(f).metadata();console.log(f,m.width+'x'+m.height)}})"`
Expected: `app/apple-icon.png 180x180`, `public/brand/logo-512.png 512x512`.

**Step 5: Commit**

```bash
git add scripts/build-brand-assets.mjs package.json app/icon.png app/apple-icon.png public/brand/logo-512.png public/brand/logo-wordmark.png
git commit -m "feat(brand): sharp asset generator + png deliverables (icons, tiles, wordmark)"
```

---

## Task 6: Update the OG social card

Replace the plain 12px periwinkle bar with the stacked-braces mark, built from Satori-safe divs + brace glyphs (Satori doesn't render arbitrary `<path>` reliably; flex divs + `{`/`}` text do).

**Files:**
- Modify: `app/opengraph-image.tsx:22` (the bar `<div>`)

**Step 1: Replace the bar with the mark**

Swap the single `<div style={{ width: "12px", height: "64px", ... }} />` for:

```tsx
<div style={{ display: "flex", alignItems: "center", gap: "10px", marginRight: "8px" }}>
  <div style={{ fontSize: 96, color: "#7f98f5", display: "flex", fontWeight: 600 }}>{"{"}</div>
  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
    <div style={{ width: "56px", height: "10px", borderRadius: "5px", backgroundColor: "#fafafa", display: "flex" }} />
    <div style={{ width: "36px", height: "10px", borderRadius: "5px", backgroundColor: "#fafafa", display: "flex" }} />
    <div style={{ width: "46px", height: "10px", borderRadius: "5px", backgroundColor: "#fafafa", display: "flex" }} />
  </div>
  <div style={{ fontSize: 96, color: "#7f98f5", display: "flex", fontWeight: 600 }}>{"}"}</div>
</div>
```

Keep everything else (layout, title, subtitle) unchanged.

**Step 2: Verify the card renders**

Run: `yarn dev`, open `http://localhost:3000/opengraph-image`.
Expected: 1200×630 PNG; braces mark left of "Form Builder", no Satori error in terminal. Stop `dev`.

**Step 3: Commit**

```bash
git add app/opengraph-image.tsx
git commit -m "feat(brand): braces mark in OG social card"
```

---

## Task 7: README wordmark + brand usage note

**Files:**
- Modify: `README.md` (top — add the wordmark image)
- Create: `public/brand/README.md` (usage/guardrails)

**Step 1: Add the wordmark to the top of `README.md`**

Above the current H1, add (raw path works on the site; on GitHub it resolves against the repo, so use a repo-relative link):

```md
<p align="center">
  <img src="./public/brand/logo-wordmark.png" alt="Form Builder" width="260" />
</p>
```

**Step 2: Write `public/brand/README.md`**

```md
# Brand assets

- `logo-mark.svg` — source of truth. Braces are `#7f98f5`; rows use `currentColor`
  (inherit surrounding text color). Prefer this inline.
- `../../app/icon.svg` — theme-adaptive 2-row favicon (auto-served by Next).
- `logo-512.png` — npm org avatar (upload manually on npmjs.com).
- `logo-wordmark.png` — README / marketing lockup.

Regenerate all PNGs: `yarn brand:assets`.

Rules: flat only — no shadows, gradients, or rings. Only `apple-icon` and the
npm avatar sit on a rounded tile; the bare mark is tile-free everywhere else.
```

**Step 3: Verify**

Run: preview `README.md` (VS Code / GitHub). Expected: wordmark renders at the top.

**Step 4: Commit**

```bash
git add README.md public/brand/README.md
git commit -m "docs(brand): README wordmark + brand-asset guardrails"
```

---

## Task 8: Final verification + PR

**Step 1: Full gate**

Run: `yarn lint && yarn test && yarn build`
Expected: all green. Build emits `icon.svg`, `apple-icon.png`, and `opengraph-image` in the route manifest.

**Step 2: Manual sweep**

Run: `yarn start`, then check: `/` nav lockup, browser tab icon (light + dark OS theme), `/opengraph-image`, `/icon.svg`. Expected: mark correct on every surface.

**Step 3: Push + PR**

```bash
git push -u origin feat/logo-brand-identity
gh pr create --fill
```

PR body ends with:
```
🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

---

## Out of scope (do not build)

- Renaming the npm package (`@form-builder/engine` placeholder) — separate decision.
- Animated/motion logo, dark-mode-only marketing variants, embroidery/print one-color sheet.
- Stacked wordmark lockup SVG — add only if a surface needs it.
