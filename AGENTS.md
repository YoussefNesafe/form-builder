<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Form Builder

Config-driven form engine (Next.js 16 / React 19 / RHF 7 / Zod 4 / Tailwind 4). The portable package lives in `form-builder/`; the app around it is demo + example forms. Design docs: `docs/plans/2026-07-05-form-builder-design.md` (read before touching `form-builder/core/`) and `form-builder-spec.md`.

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
- `app/demo`, `app/forms/*` — demo playground and example form pages

## Responsive system (MUST follow when touching any UI)

- Three breakpoints: mobile (base, no prefix), `tablet:` (481px), `desktop:` (1025px). Defined in `app/globals.css` `@theme`. Do NOT use `sm:`/`md:`/`lg:`.
- Sizing convention: px arbitrary values triplicated across breakpoints, e.g. `text-[14px] tablet:text-[14px] desktop:text-[14px]`. This is deliberate scaffolding so each breakpoint can be tuned independently later — keep the triplication when adding or editing classes; do not collapse "redundant" duplicates or convert back to rem-scale utilities (`text-sm`, `p-4`, `rounded-md`, ...).
- Field width: `width?: ResponsiveFieldWidth` on field configs — `"full" | "half" | "third" | "quarter"` or `{ mobile?, tablet?, desktop? }`. Resolved by `fieldWidthClass` in `form-builder/ui/variants.ts` onto the 12-col grid (full=12, half=6, third=4, quarter=3). Unset breakpoints fall back to FULL, they do not cascade from smaller breakpoints — by design. cva variant classes are static strings only (Tailwind can't see built class names); one variant key per breakpoint.
- Flat style is user-mandated: states via border color only, no shadows/rings (`FLAT_GRID_CLASS` enforces it).

## OTP

- `useOtpFlow` — headless per-field send/verify reducer; `OtpField` is presentation-only.
- `useOtpController` (exported) — verified-code registry + host API glue. Takes a per-field handler map (e.g. `emailOtp` -> email API) with a fieldName-branched pair fallback; form-free (`send(fieldName, values)` gets values from the field flow). `FormRenderer` accepts either the `otp` controller prop or legacy `onSendOtp`/`onVerifyOtp` (dev-warns if both).
- Submit gating uses the verified-code registry checked by a schema refine — NOT form state. `dependsOn` reset relies on generation stamping + registry invalidation + a reset-pending ref (stale-verify race fix); don't simplify these away.
- Config validator dev-warns when an otp field and its `dependsOn` source are on different wizard steps, and rejects group-nested otp wiring.

## Intentional decisions — do NOT "fix"

- `shouldUnregister` stays `false`; the condition-aware resolver validates only visible fields; submit payload = zod strip-mode parsed output. Do not revert to `shouldUnregister: true` or a static schema.
- Steppers gate on `trigger(stepFieldNames)`, never `formState.isValid`. Submit buttons gating on `isValid` is the one deliberate exception.
- `shadcn` stays a devDependency — `globals.css` imports `shadcn/tailwind.css` at build. shadcn 4.13 has no RHF `form` component; use `field` primitives + Controller.
- `validateFormConfig` runs in production (configs may be CMS-sourced) — do not re-add a NODE_ENV guard.
- Dates are plain `yyyy-MM-dd` strings compared by date part, never epoch math (TZ off-by-one).
- Custom field types register via `registerField`; validated as BaseField only, values pass through as `z.unknown().optional()`.
- Known v1 limitation (pinned by test): conditions on fields inside groups are not skipped by validation.
