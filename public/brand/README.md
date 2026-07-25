# Brand assets

- `logo-mark.svg` — source of truth. Braces are `#7f98f5`; rows use `currentColor`
  (inherit surrounding text color). Prefer this inline.
- `../../app/icon.svg` — theme-adaptive 2-row favicon (auto-served by Next).
- `logo-512.png` — npm org avatar (upload manually on npmjs.com).
- `logo-wordmark.png` — README / marketing lockup.

Regenerate all PNGs: `yarn brand:assets`.

Rules: flat only — no shadows, gradients, or rings. Only `apple-icon` and the
npm avatar sit on a rounded tile; the bare mark is tile-free everywhere else.
