# Phone Country Sync (`countryFrom`) — Design

Date: 2026-07-08
Status: Approved

## Problem

Some forms have a country-of-residence select and a phone field. When the user picks a residence country, the phone field's ISO country (flag + calling code) should follow — while the user keeps the ability to change the phone country manually afterwards. This must be opt-in per field/per form: forms that don't ask for it behave exactly as today.

## Decisions (confirmed with user)

- **Scope**: core config feature in the portable `form-builder/` package, not an app-level one-off.
- **Source values**: the residence select's option values are ISO 3166-1 alpha-2 codes (`"AE"`, `"SA"`, ...). No mapping layer.
- **Re-sync rule**: residence change *always* re-syncs the phone country, even after a manual override or typed digits. User can override again afterwards.
- **Opt-in**: `countryFrom` is optional. Omitted → zero new code paths run.

## Config API

```ts
// form-builder/core/types.ts
| (BaseField & {
    type: "phone";
    defaultCountry?: string;
    preferredCountries?: string[];
    countryFrom?: string; // name of a select field whose values are ISO alpha-2
  })
```

Example:

```ts
{ type: "select", name: "residence", options: [{ value: "AE", label: "United Arab Emirates" }, ...] },
{ type: "phone", name: "mobile", countryFrom: "residence" },
```

## Runtime behavior (PhoneField)

- `useWatch` on the `countryFrom` field — same pattern as otp `dependsOn` and condition evaluation.
- On watched value **change** (tracked with a previous-value ref):
  - Resolve new calling code via `getCountryCallingCode(iso)`.
  - Rewrite the phone value's calling-code prefix, preserving already-typed national digits (`+20 100...` → `+971 100...`). `react-phone-number-input` derives the selected country from the value, so the flag follows automatically — no remount, no lib fork.
  - Phone empty → set value to `+<callingCode>` so the flag/prefix seed.
- **Initial mount**: no rewrite if the phone already has a value (saved drafts not clobbered). If phone is empty and residence already has a value, seed the calling code.
- **Manual override**: internal country select untouched — user can still change country; the next residence change re-syncs (per decision).
- **Edge cases**:
  - Source cleared → no-op (keep current phone country).
  - Source value not a valid ISO code → ignore at runtime (dev-warn); static configs are caught by the validator.
  - National digits invalid in the new country → normal onBlur validation flags it; expected.

## Config validation (`validateFormConfig`)

Mirrors otp `dependsOn` wiring rules:

- `countryFrom` must reference an existing field; that field must be a `select` (single, not `multiple`).
- Every option value of the source select must be a valid ISO alpha-2 country (statically checkable via `getCountryCallingCode`).
- Dev-warn when phone and source are on different wizard steps.
- Reject group-nested wiring (either side inside a group).

## Alternatives considered

- **B — controlled-country rebuild**: switch to `react-phone-number-input/input` + own country state. Cleaner model but a full PhoneField rewrite re-implementing lib plumbing. Rejected: cost ≫ benefit.
- **C — generic config `effects` system**: general derived-value machinery. Rejected as YAGNI; `countryFrom` can migrate into such a system later if more linked-field needs appear.

## Testing

- Sync on source change (flag + calling code update).
- National digits preserved across calling-code rewrite.
- Manual override works, then next source change re-syncs.
- Mount with existing phone value → no clobber; mount empty with residence set → seeded.
- Validator: missing source, non-select source, non-ISO option values, cross-step warn, group-nested reject.
- No `countryFrom` → behavior identical to today.
