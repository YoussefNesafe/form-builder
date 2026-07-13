<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Form Builder

Config-driven form engine (Next.js 16 / React 19 / RHF 7 / Zod 4 / Tailwind 4). The portable package lives in `form-builder/`; the app around it hosts the visual builder (`components/builder/`, rendered on the home page). The config shape's source of truth is `form-builder/core/types.ts`; read this file's rules below before touching `form-builder/core/`.

## Commands

- `yarn dev` / `yarn build` / `yarn start`
- `yarn test` — vitest run (single pass, no watch)
- `yarn lint` — eslint

## Layout

- `form-builder/core/` — types, config `schema` validation, zod `validation` builder, conditions, messages, field registry
- `form-builder/components/` — `FormRenderer` (entry), `FormStepper`, `FieldRuntime`, `renderField`
- `form-builder/fields/` — one component per built-in field type (Text, Select, Date, Otp, Phone, Group, ...)
- `form-builder/hooks/` — `useDynamicForm`, `useOtpFlow`, `useOtpController`
- `form-builder/ui/` — `FieldWrapper`, cva `variants`, `layout` (`FLAT_GRID_CLASS` 12-col grid)
- `form-builder/store/` — zustand stepper store
- `components/ui/` — shadcn primitives (customized — see styling rules)
- `components/builder/` — visual builder (authoring UI over `FormConfig`; exports TS/JSON via header "Export code"; panes: `PreviewPanel`, `CodeOutputPanel`, boundary `BuilderPreviewBoundary`)
- `components/home/` — flat landing-page section components (`HeroSection`, `ShowcaseSection`, `FlagshipSplit`, `CapabilitiesSection`, `ComparisonStrip`, each ending in the shared `SectionCtas` pair) composed by `app/(site)/page.tsx`; `content.ts` holds structural (non-copy) data, `demoConfig.ts` the hero demo's `FormConfig`, `generatedCode.ts`/`fieldPeek.ts` derive every landing-page code pane/peek from a real config via the builder's own serializer (never a hand-maintained code string) — `FlagshipSplit` reuses only `multiStepSignupConfig` + the OTP stubs from `app/(site)/examples/multi-step-signup/`; its live leaf is the lean `components/home/FlagshipSignupForm` (scoped field registration — deliberately NOT `SignupExampleForm`, whose `ExampleForm` base calls `registerBuiltInFields()` and would pull all 24 field renderers into the landing bundle)
- `components/shared/` — cross-feature primitives used by 3+ surfaces (`LinkCard`, `containers.ts` page-width constants); single-surface components stay in their feature folder (`components/docs/`, `components/examples/` — e.g. `DocsProse`, `ExamplePageShell`, `StaticExampleBoundary`)
- `app/(site)/` — route group with the shared site shell (`SiteNav` rendered once in its layout); contains the marketing landing (`app/(site)/page.tsx`, route `/`), docs, and examples
- `app/builder/page.tsx` — visual builder route (`FormBuilder` from `components/builder/`), deliberately outside `(site)` (no SiteNav, full-height workspace)
- `locales/` — typed TS dictionary (single locale `en`, per-domain modules); `t` direct access, `getDictionary(locale)` future seam — see "i18n dictionary" below

## Responsive system (MUST follow when touching any UI)

- Three breakpoints: mobile (base, no prefix), `tablet:` (481px), `desktop:` (1025px). Defined in `app/globals.css` `@theme`. Do NOT use `sm:`/`md:`/`lg:`.
- Sizing convention: px arbitrary values triplicated across breakpoints, e.g. `text-[14px] tablet:text-[14px] desktop:text-[14px]`. This is deliberate scaffolding so each breakpoint can be tuned independently later — keep the triplication when adding or editing classes; do not collapse "redundant" duplicates or convert back to rem-scale utilities (`text-sm`, `p-4`, `rounded-md`, ...).
- **Portable-package sizing tokens (`form-builder/` ONLY):** inside `form-builder/**`, every vw size literal is wrapped as a CSS-var reference with the literal as its fallback — `gap-[var(--fb-space-3,1.602vw)] tablet:gap-[var(--fb-space-3-tablet,0.75vw)] desktop:gap-[var(--fb-space-3-desktop,0.312vw)]`. This is the consumer override seam (approach #1): a host that copies the package retheme any step in any unit by redefining the token; leaving it undefined renders the fallback (zero required setup). Rules: (1) the fallback MUST stay the exact original literal — parity is by construction; (2) triplication is preserved (one `var()` per breakpoint, tiers are independent — `--fb-space-N` mobile / `-tablet` / `-desktop`), never collapse to one class; (3) the scale is a numeric length scale, step = `tablet-vw / 0.25` (mobile = step×0.534vw, desktop = step×0.104vw) — reuse an existing step when a value matches, don't invent semantic token names; (4) the class string stays a static literal (Tailwind can't see built names) — the ONLY dynamic part is the CSS var *value*, resolved at paint. Default token set + docs live in `form-builder/theme/tokens.css` (optional import). App-owned UI outside `form-builder/` (`components/ui|builder|home`, `app/**`) stays on bare triplicated literals — do NOT wrap those.
- Field width: `width?: ResponsiveFieldWidth` on field configs — `"full" | "half" | "third" | "quarter"` or `{ mobile?, tablet?, desktop? }`. Resolved by `fieldWidthClass` in `form-builder/ui/variants.ts` onto the 12-col grid (full=12, half=6, third=4, quarter=3). Unset breakpoints fall back to FULL, they do not cascade from smaller breakpoints — by design. cva variant classes are static strings only (Tailwind can't see built class names); one variant key per breakpoint.
- Flat style is user-mandated: states via border color only, no shadows/rings (`FLAT_GRID_CLASS` enforces it).

## OTP

- `useOtpFlow` — headless per-field send/verify reducer; `OtpField` is presentation-only.
- `useOtpController` (exported) — verified-code registry + host API glue. Takes a per-field handler map (e.g. `emailOtp` -> email API) with a fieldName-branched pair fallback; form-free (`send(fieldName, values)` gets values from the field flow). `FormRenderer` accepts either the `otp` controller prop or legacy `onSendOtp`/`onVerifyOtp` (dev-warns if both).
- Submit gating uses the verified-code registry checked by a schema refine — NOT form state. `dependsOn` reset relies on generation stamping + registry invalidation + a reset-pending ref (stale-verify race fix); don't simplify these away.
- Config validator dev-warns when an otp field and its `dependsOn` source are on different wizard steps, and rejects group-nested otp wiring.

## New field types (time, rating, segmented, country, masked, signature)

- Times are plain zero-padded `"HH:mm"` strings compared lexicographically — same convention as dates, never Date math.
- `masked` stores the RAW value (token chars only); the mask is presentation. `extractRaw` in `form-builder/fields/maskedValue.ts` walks mask+display in tandem so literals matching a token class (the "1" in `"+1 ###"`) are never absorbed — do not "simplify" it back to class-filtering. Masks like `"#1#"` (literal matches its own slot's class) swallow that keystroke by design (wrong value never stored).
- `signature` resize handling must use `pad.redraw()` — a manual `toData()`/`fromData()` pair wipes `fromDataURL`-restored ink (fromDataURL stores pixels, not points). `penColor` is static config; a field that mounts disabled needs the explicit `pad.off()` (constructor auto-ons).
- `country` values are ISO alpha-2 by construction and valid as a phone `countryFrom` source (no option checks). Labels resolve `locale.countryLabels` → `Intl.DisplayNames` → code; hosts that localize should pass `countryLabels` (avoids an SSR/browser locale hydration mismatch on preset values).
- `segmented` is the radix RadioGroup primitive (radio semantics), deliberately not ToggleGroup — guaranteed radiogroup/radio roles + arrow-key roving; an optional segmented cannot be cleared once set (same as radio — and same for `country`, whose combobox has no clear row).

## Phone country sync (`countryFrom`)

- Phone configs may set `countryFrom: "<sibling country field or single-select>"` (select option values must be ISO alpha-2; country fields are ISO by construction); the phone re-syncs its country on every source change — source always wins, manual override stays possible until the next change. Validator enforces the wiring, rejects group nesting, dev-warns cross-step.
- `useCountryFromSync` treats the first render after (re)mount as baseline (drafts not clobbered; cross-step changes deliberately skipped) and the seed sets no dirty/touched flags on purpose.
- `ref={rhf.ref}` goes on `<PhoneInput>` itself, never `numberInputProps.ref` — the latter clobbers the lib's internal input ref, crashing focus-on-country-select and silently aborting manual country changes.

## i18n dictionary

- Copy lives in `locales/en/*.ts` domain modules (`common`, `nav`, `home`, `docs`, `examples`, `builder`, `fieldTypes`), composed into `en` and re-exported as `t` (server components) from `locales/index.ts`; `getDictionary(locale)` is a future-locale seam, unwired today.
- Client components import their domain slice directly (`@/locales/en/builder`, not `@/locales`) so unrelated domains don't ride along into that bundle; `fmt` (`{name}` interpolation) is a standalone import for the same reason.
- `locales/` has a one-way dependency on the engine (may import `@/form-builder` types, never `components/builder/**`); the builder is a one-way consumer of `fieldTypes.ts`, not a source for it (one test-only exception, commented at its import site).
- `fieldTypes.ts` is the sole source for built-in field-type `label`/`description`/`note` (docs table + builder add-menu/rows/prop-editor); `FIELD_META` in `components/builder/model/fieldMeta.ts` is structure-only (`group`/`icon`) — `locales/fieldTypes.test.ts` pins both halves.
- Long-form docs prose stays in JSX, not the dictionary (staff-engineer ruling); not translated: demo/example configs, code snippets, field names, builder seed data. See ADR-0001 for the full rationale and rejected alternatives.

## Intentional decisions — do NOT "fix"

- `shouldUnregister` stays `false`; the condition-aware resolver validates only visible fields; submit payload = zod strip-mode parsed output. Do not revert to `shouldUnregister: true` or a static schema.
- Steppers gate on `trigger(stepFieldNames)`, never `formState.isValid`. Submit buttons gating on `isValid` is the one deliberate exception.
- `shadcn` stays a devDependency — `globals.css` imports `shadcn/tailwind.css` at build. shadcn 4.13 has no RHF `form` component; use `field` primitives + Controller.
- `validateFormConfig` runs in production (configs may be CMS-sourced) — do not re-add a NODE_ENV guard.
- Dates are plain `yyyy-MM-dd` strings compared by date part, never epoch math (TZ off-by-one).
- Custom field types register via `registerField`; validated as BaseField only, values pass through as `z.unknown().optional()`.
- Known v1 limitation (pinned by test): conditions on fields inside groups are not skipped by validation.
- `useSourceSync`'s restore-generation guard (re-baseline on `restoreGeneration` change instead of applying) is load-bearing for copyFrom, phone `countryFrom`, and optionsFrom stale resets — removing it silently reintroduces the autosave-restore clobber bug (drafted manual overrides overwritten by the restored source value).
- Cross-field rules (`rules.matches`, date/time sibling bounds) and optionsFrom branch membership live in the form-level superRefine, NEVER in a field's own schema — the `isFieldValid` oracle behind isValid conditions parses field schemas in isolation.
