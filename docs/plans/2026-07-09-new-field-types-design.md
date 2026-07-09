# New Field Types Design

**Date:** 2026-07-09
**Status:** Approved — implemented; two details superseded by review findings (see AGENTS.md "New field types"): SegmentedField ships on the radix RadioGroup primitive (not ToggleGroup — guaranteed radio semantics), and the signature resize handler uses `pad.redraw()` (a manual `toData()`/`fromData()` pair wipes `fromDataURL`-restored ink). Messages also gained `invalidCountry` and `searchCountry`.

## Problem

The form builder covers text-like, choice, date, phone, otp, file, group and layout fields, but common form needs still require custom fields: picking a time, rating something, compact single-choice toggles, choosing a country, formatted inputs (card numbers, IBANs), and signatures. Each should be a first-class built-in type with typed config, config validation, and value validation.

## Scope

Six new built-in field types:

| type | value shape | one-liner |
| --- | --- | --- |
| `time` | `"HH:mm"` string | time-of-day picker |
| `rating` | number (1..max) | star rating |
| `segmented` | `string \| number` | radio rendered as a button group |
| `country` | ISO alpha-2 string | country picker with flags |
| `masked` | raw string (literals stripped) | pattern-masked text input |
| `signature` | PNG data-URL string | draw-to-sign canvas |

Out of scope (deferred, recorded separately): checkbox group (already exists — `checkbox` with `options`), datetime as a single field (compose `date` + `time` instead), cross-field features (`matches`, `copyFrom`, options-from-source), form-level features (autosave, review step, conditional steps, RTL).

## Decisions (user-confirmed)

- **All six are built-in types** (Approach A) — each joins `BUILT_IN_FIELD_TYPES`, the `FieldConfig` union, `schema.ts` config validation, `validation.ts` zod builder, gets its own component and registry entry. No mixed built-in/custom split.
- **Time is time-only** — no combined datetime type. Value is a plain `"HH:mm"` string, consistent with the plain-string `yyyy-MM-dd` date decision (no epoch math).
- **Masked stores the raw value** — submit payload gets unmasked characters (`"4111111111111111"`), the input displays the mask (`"4111 1111 1111 1111"`). Mask is hand-rolled, no dependency.
- **Signature uses `signature_pad`** (szimek/signature_pad, ~10 kB, zero deps) — the one new dependency.
- **Country flags reuse `react-phone-number-input/flags`** — SVG components per ISO code, already a dependency, consistent with the phone field. (Emoji flags rejected: Windows Chrome renders them as letter pairs.)

## Config API (`form-builder/core/types.ts`)

```ts
| (BaseField & { type: "time"; minTime?: string; maxTime?: string; stepMinutes?: number })
| (BaseField & { type: "rating"; max?: number })                       // default 5
| (BaseField & { type: "segmented"; options: Option[] })
| (BaseField & { type: "country"; countries?: string[]; preferredCountries?: string[] })
| (BaseField & { type: "masked"; mask: string; message?: string })
| (BaseField & { type: "signature"; penColor?: string; heightPx?: number })
```

## Value validation (`form-builder/core/validation.ts`)

- **time** — string matching `^([01]\d|2[0-3]):[0-5]\d$` (message `invalidTime`); `minTime`/`maxTime` compared lexicographically (valid for zero-padded `HH:mm`, same trick as ISO dates). Optional → `optionalEmptyable`.
- **rating** — integer, `1..max` (max defaults to 5). Optional → `optionalClearable`.
- **segmented** — identical to radio: `optionValueSchema(options)`; optional → `optionalClearable`.
- **country** — string that is a member of the allowed set: `countries` subset if configured, else `getCountries()` from libphonenumber-js. Optional → `optionalClearable`.
- **masked** — raw string; completeness check: raw length === number of token chars in the mask. Error message: per-field `message`, else `maskIncomplete`. Optional → `optionalEmptyable` (empty raw = absent).
- **signature** — string starting with `"data:image/"`. Optional → `optionalEmptyable`.

## Config validation (`form-builder/core/schema.ts`)

First pass (zod per-type entries) plus second-pass checks:

- **time**: `minTime`/`maxTime` must be valid `HH:mm`; `minTime <= maxTime`; `stepMinutes` positive integer.
- **rating**: `max` integer between 2 and 10.
- **segmented**: same option rules as radio (non-empty options, etc.).
- **country**: every entry in `countries` and `preferredCountries` must be a valid ISO alpha-2 code per `getCountries()`; `preferredCountries` ⊆ `countries` when both set.
- **masked**: `mask` non-empty and contains at least one token char (`#`, `A`, `*`).
- **signature**: `heightPx` positive integer if set.
- **`countryFrom` source upgrade**: a phone field's `countryFrom` may now point at a `country` field as well as an ISO-valued single select. A `country` source needs no option-value check — its values are ISO by construction. Existing select-source rules unchanged.

## Components (`form-builder/fields/`)

All follow the existing pattern: `Controller` + `FieldWrapper`, flat style (state via border color only, no shadows/rings), px sizing triplicated across `mobile/tablet:/desktop:` breakpoints.

- **TimeField** — native `<input type="time">` styled like the existing flat Input. Free OS picker, keyboard accessible.
- **RatingField** — row of lucide `Star` buttons. `role="radiogroup"`, each star `role="radio"` with `aria-checked`; arrow keys move, click selects; clicking the current value clears it when the field is optional. Aria-label per star via `ratingValue(n, max)`. No hover preview (YAGNI).
- **SegmentedField** — radix ToggleGroup `type="single"` (from the already-installed unified `radix-ui` package). Flat bordered buttons; selected state = border/background color change only.
- **CountryField** — searchable combobox reusing the command-popover pattern from SelectField. Option rows: SVG flag from `react-phone-number-input/flags` + display name via `Intl.DisplayNames` (browser locale, English fallback). `preferredCountries` sort to the top. Always searchable.
- **MaskedField** — controlled Input. Tokens: `#` = digit, `A` = letter, `*` = any alphanumeric; all other mask chars are literals inserted automatically. Store raw (token chars only), render formatted. Known v1 limitation (documented in code + spec): caret can jump on mid-string edits; typing/deleting at the end is fully correct.
- **SignatureField** — `<canvas>` driven by `signature_pad`. `onEnd` → `toDataURL("image/png")` into RHF. Clear button (label `clearSignature`) resets pad + value. Resize handling: ResizeObserver re-scales the canvas for devicePixelRatio and redraws strokes via `toData()`/`fromData()` so drawings survive container resizes. Disabled state calls `pad.off()`.

## Messages (`form-builder/core/messages.ts`)

New keys: `invalidTime`, `maskIncomplete`, `clearSignature`, `ratingValue(n: number, max: number)`.

## Demo + docs

- `app/demo/page.tsx`: replace the `residence` select with `type: "country"`, `countries: ["NL", "AE", "EG", "SA"]` — still feeds the phone's `countryFrom` (showcases the source upgrade). Add time, rating, segmented, masked (card number mask `#### #### #### ####`), and signature fields across the wizard steps.
- `form-builder-spec.md`: entries for all six types.
- `AGENTS.md`: record new invariants only — signature redraw-on-resize mechanism, masked raw-value semantics, country-as-`countryFrom`-source.

## Testing

- `schema.test.ts`: config-validation cases per type (valid config accepted; each second-pass rule rejected with its message).
- Validation tests: value schemas — time format + bounds, rating int/range, masked completeness, country membership, signature prefix, segmented option values.
- Component tests: rating keyboard nav + click-to-clear, masked strip/format round-trip, segmented selection, time render + change, country search + pick + `countryFrom` wiring.
- Signature: jsdom has no real canvas — mock `signature_pad`; test clear button + RHF value wiring only. Real stroke behavior verified live in the browser after implementation (as done for phone `countryFrom`).

## Alternatives considered

- **Mixed built-in/custom split** (masked + signature via `registerField`): keeps the package dependency-free but drops typed config, config validation, and value validation for those two. Rejected — splits quality tiers for a 10 kB dep.
- **All custom-registered**: zero core changes but loses everything built-ins provide. Only justified if the package API were frozen.
- **Mask library (imask/maska)**: solves mid-string caret perfectly but adds a dependency far heavier than the feature; hand-rolled tokens cover the common masks (card, IBAN, plates).
- **Emoji flags**: zero-dep but render as letter pairs on Windows Chrome — the user's own platform.
- **Combined datetime type**: composable from `date` + `time` side by side; a single field doubles validation edge cases for no new capability.
