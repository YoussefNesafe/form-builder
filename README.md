# Form Builder

**shadcn for forms.** Design a form visually, then copy out real, Zod- and
React-Hook-Form–validated React code you own — not a hosted widget, not a
runtime dependency on this repo.

## What it is

Two parts:

- **`form-builder/`** — a portable, config-driven form engine. You write a
  `FormConfig` (a plain TS/JSON object) and it renders a fully validated,
  conditional, multi-step form. This is the actual product; everything else
  is scaffolding around it.
- **The visual builder** (`components/builder/`, served from the app's home
  page) — an authoring UI for that same `FormConfig`. Drag fields onto a
  canvas, wire up conditions and cross-field rules, then hit **Export code**
  to get a TypeScript or JSON config you paste into your own project.

The builder is the funnel; the engine is the product. Nothing your users fill
out is submitted anywhere by this project — you own `onSubmit`.

## Feature highlights

- **24 field types**, including `phone` (with `countryFrom` sibling sync),
  `masked` (raw value stored, mask is presentation-only), `signature`
  (canvas, PNG data URL), `country` (ISO alpha-2 combobox), `rating`,
  `segmented`, `otp`, `date`/`time`, `slider`, repeatable `group`, and more.
  Full list on the [Field types docs page](https://form-builder.youssefnesafe.com/docs/field-types) (`/docs/field-types` in the running app).
- **Multi-step wizards** with conditional steps (`visibleWhen` on a step) and
  an optional read-only **review step** that summarizes all visible fields
  with per-step edit links.
- **Conditional visibility**: `visibleWhen` / `disabledWhen` on any field,
  evaluated against live form values.
- **Cross-field rules**: `rules.matches` (e.g. confirm-password) and
  date/time sibling bounds, enforced in a form-level `superRefine` — not
  per-field, so they compose correctly with conditional visibility.
- **Field wiring**: `optionsFrom` (derive a select's options from another
  field's value) and `copyFrom` (mirror a value across fields).
- **Guardrailed config validation** (`validateFormConfig`) that runs in
  production too, since configs may be CMS-authored — it rejects oversized
  or ReDoS-shaped `rules.pattern`/`mask` patterns, unsafe character classes,
  dotted field names, unknown country codes, and malformed date bounds.
- **Autosave / draft restore** to `localStorage`, keyed per form with a
  config-hash guard so a changed config discards a stale draft.
- **Custom field types** via `registerField(type, Component)` — register
  project-specific fields without touching the package internals.

## Getting started

```bash
yarn install
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) — that's the visual
builder. Add fields, group them into steps if you need a wizard, set
conditions/rules in the side panel, then click **Export code** in the header
to get the `FormConfig` as TypeScript or JSON. **Reset** clears the builder's
local draft.

## Adopting the engine in your own app

The engine is copy-in, not an npm package — same model as shadcn/ui.

1. Copy the `form-builder/` folder into your Next.js project.
2. Copy `components.json` conventions or add the shadcn primitives the
   engine's fields depend on:
   ```bash
   npx shadcn@latest add button calendar checkbox command dialog field \
     input input-group input-otp label popover progress radio-group \
     select separator slider switch textarea
   ```
   (This is the exact set under `components/ui/` in this repo — check it
   against your own `components/ui/` before re-adding anything.) `shadcn`
   itself stays a **devDependency** (it's a codegen CLI, not a runtime lib);
   `app/globals.css` pulls its base layer in with `@import "shadcn/tailwind.css";`
   — add the same import to your own global stylesheet.
3. Install the runtime peer dependencies the engine's fields use:
   ```bash
   yarn add react-hook-form @hookform/resolvers zod zustand \
     class-variance-authority clsx tailwind-merge cmdk date-fns \
     react-day-picker input-otp libphonenumber-js react-phone-number-input \
     signature_pad lucide-react radix-ui tw-animate-css
   ```
   Plus `tailwindcss@^4` and `@tailwindcss/postcss` if you don't already
   have Tailwind 4 set up.
4. Call `registerBuiltInFields()` once (e.g. in a root layout or app entry)
   before rendering any `FormRenderer`, then import `FormRenderer`,
   `useDynamicForm`, and the rest of the public surface from
   `form-builder/index.ts` — that's the only file consumers should import
   from. Nothing outside `index.ts` is a supported entry point.

## Honest limitations

- **Client-rendered only.** The engine has no server-rendering story — the
  large majority of its source files are `"use client"`. Don't advertise this
  as an RSC form solution.
- **No submission or storage backend.** There is no hosted "responses"
  feature. You supply `onSubmit`; autosave only ever writes to the visiting
  browser's `localStorage` (and signature values are excluded from autosave
  by default).
- **Signature field is not keyboard-accessible.** Drawing with `signature_pad`
  is inherently pointer/touch-only; there's no keyboard fallback.
- **The visual builder persists to `localStorage` only.** There's no
  server-side project storage — clearing site data loses an unexported
  draft.

## Commands

```bash
yarn dev     # start the dev server
yarn build   # production build
yarn start   # run a production build
yarn test    # vitest run (single pass, no watch)
yarn lint    # eslint
```

## License

MIT © 2026 [YoussefNesafe](https://github.com/YoussefNesafe) — see
[LICENSE](./LICENSE).
