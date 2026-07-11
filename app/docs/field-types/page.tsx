import type { Metadata } from "next";
import Link from "next/link";
import { BUILT_IN_FIELD_TYPES, type FieldType } from "@/form-builder";

export const metadata: Metadata = { title: "Field types" };

type FieldTypeInfo = {
  description: string;
  note?: string;
};

// Curated one-line descriptions, written from form-builder/core/types.ts and
// form-builder-spec.md — not invented. Deliberately Partial: if
// BUILT_IN_FIELD_TYPES gains a type before this map is updated, the row
// falls back to FALLBACK below instead of the page failing to build.
const FIELD_TYPE_INFO: Partial<Record<FieldType, FieldTypeInfo>> = {
  text: { description: "Single-line text input." },
  email: { description: "Text input with email-format validation." },
  password: {
    description: "Text input with a show/hide toggle.",
    note: "Optional complexity rules (min length, upper/lower/digit/symbol requirements) via complexity.",
  },
  textarea: { description: "Multi-line text input." },
  masked: {
    description: "Pattern-masked text input (# digit, A letter, * alphanumeric, other characters literal).",
    note: "Stores the raw token characters — the mask is presentation-only, not part of the value.",
  },
  number: { description: "Numeric input with optional min, max, and step." },
  otp: {
    description: "One-time-passcode input (shadcn input-otp) with a configurable length.",
    note: "dependsOn gates it on a sibling field's value and invalidates the verified code when that value changes.",
  },
  phone: {
    description: "International phone input (react-phone-number-input) with a country flag dropdown.",
    note: "countryFrom syncs the selected country from a sibling country or single-select field — the source always wins over a manual pick until it changes again.",
  },
  select: {
    description: "Dropdown, or a searchable combobox when searchable is set; supports multiple.",
    note: "optionsFrom can derive the option list from another field's current value instead of a static options array.",
  },
  country: {
    description: "Searchable combobox of ISO 3166-1 alpha-2 countries, with flags.",
    note: "Value is ISO alpha-2 by construction, so it's always a valid phone countryFrom source. Like an optional radio, it can't be cleared once set — the combobox has no clear row.",
  },
  radio: { description: "Exclusive choice from a set of options." },
  segmented: {
    description: "Radio semantics (radix RadioGroup) rendered as a joined button group.",
    note: "An optional segmented field can't be cleared once set — same as radio.",
  },
  checkbox: { description: "Boolean checkbox, or a checkbox group when options is set." },
  switch: {
    description: "Boolean toggle switch.",
    note: "Always a single boolean value — options are not supported (use checkbox for a group).",
  },
  date: {
    description: "Single date or range picker (react-day-picker).",
    note: 'Value is a plain "yyyy-MM-dd" string (or a {from, to} pair for range), compared by date part — never epoch math.',
  },
  time: {
    description: "Native time input.",
    note: 'Value is a zero-padded "HH:mm" string, compared lexicographically — same convention as dates.',
  },
  rating: {
    description: "1..max star rating (default max 5).",
    note: "Clicking the current value clears it when the field is optional.",
  },
  slider: { description: "Numeric slider (shadcn Slider) with min, max, and step." },
  signature: {
    description: "Draw-to-sign canvas (signature_pad); value is a PNG data URL.",
    note: "Not keyboard-accessible — drawing is inherently pointer/touch-only, with no keyboard fallback.",
  },
  file: { description: "File upload with progress; accept, maxSizeMB, and multiple." },
  hidden: { description: "Not rendered; carries a static value along with the rest of the form's values." },
  static: { description: "Non-field content block — heading, paragraph, or divider. Has no value." },
  group: {
    description: 'Repeatable sub-array of fields (e.g. "add another team member"), with min/max.',
    note: "Known v1 limitation: visibleWhen/disabledWhen conditions on fields nested inside a group are not skipped by validation.",
  },
  submit: { description: "Submit button with configurable text and variant." },
};

const FALLBACK: FieldTypeInfo = {
  description: "No description recorded yet for this type — see form-builder-spec.md for details.",
};

/**
 * Reference table of every built-in field type. The row list itself comes
 * from BUILT_IN_FIELD_TYPES (the package's own source of truth), so it can't
 * drift from the registry — only the prose description/note per type is
 * hand-maintained, and falls back to a visible placeholder rather than
 * silently omitting a type if this map falls behind.
 */
export default function FieldTypesPage() {
  return (
    <div className="flex flex-col gap-[20px] tablet:gap-[20px] desktop:gap-[20px]">
      <div className="flex flex-col gap-[8px] tablet:gap-[8px] desktop:gap-[8px]">
        <h1 className="text-[24px] tablet:text-[24px] desktop:text-[24px] font-semibold tracking-tight">
          Field types
        </h1>
        <p className="text-[14px] tablet:text-[14px] desktop:text-[14px] text-muted-foreground">
          {BUILT_IN_FIELD_TYPES.length} built-in types, registered by{" "}
          <code className="rounded-[4px] tablet:rounded-[4px] desktop:rounded-[4px] bg-muted px-[4px] tablet:px-[4px] desktop:px-[4px] py-[2px] tablet:py-[2px] desktop:py-[2px] text-[13px] tablet:text-[13px] desktop:text-[13px]">
            registerBuiltInFields()
          </code>
          . Every field also takes the shared base properties —{" "}
          <code className="rounded-[4px] tablet:rounded-[4px] desktop:rounded-[4px] bg-muted px-[4px] tablet:px-[4px] desktop:px-[4px] py-[2px] tablet:py-[2px] desktop:py-[2px] text-[13px] tablet:text-[13px] desktop:text-[13px]">
            label
          </code>
          ,{" "}
          <code className="rounded-[4px] tablet:rounded-[4px] desktop:rounded-[4px] bg-muted px-[4px] tablet:px-[4px] desktop:px-[4px] py-[2px] tablet:py-[2px] desktop:py-[2px] text-[13px] tablet:text-[13px] desktop:text-[13px]">
            required
          </code>
          ,{" "}
          <code className="rounded-[4px] tablet:rounded-[4px] desktop:rounded-[4px] bg-muted px-[4px] tablet:px-[4px] desktop:px-[4px] py-[2px] tablet:py-[2px] desktop:py-[2px] text-[13px] tablet:text-[13px] desktop:text-[13px]">
            visibleWhen
          </code>
          /
          <code className="rounded-[4px] tablet:rounded-[4px] desktop:rounded-[4px] bg-muted px-[4px] tablet:px-[4px] desktop:px-[4px] py-[2px] tablet:py-[2px] desktop:py-[2px] text-[13px] tablet:text-[13px] desktop:text-[13px]">
            disabledWhen
          </code>
          , and{" "}
          <code className="rounded-[4px] tablet:rounded-[4px] desktop:rounded-[4px] bg-muted px-[4px] tablet:px-[4px] desktop:px-[4px] py-[2px] tablet:py-[2px] desktop:py-[2px] text-[13px] tablet:text-[13px] desktop:text-[13px]">
            width
          </code>{" "}
          — not repeated per row below.
        </p>
      </div>

      <div
        tabIndex={0}
        aria-label="Field types table"
        className="overflow-x-auto rounded-[12px] tablet:rounded-[12px] desktop:rounded-[12px] border border-border"
      >
        <table className="w-full min-w-[560px] tablet:min-w-[560px] desktop:min-w-[560px] border-collapse text-left text-[13px] tablet:text-[13px] desktop:text-[13px]">
          <thead>
            <tr className="border-b border-border bg-card">
              <th
                scope="col"
                className="w-[110px] tablet:w-[110px] desktop:w-[110px] px-[14px] tablet:px-[14px] desktop:px-[14px] py-[10px] tablet:py-[10px] desktop:py-[10px] font-medium text-card-foreground"
              >
                Type
              </th>
              <th
                scope="col"
                className="px-[14px] tablet:px-[14px] desktop:px-[14px] py-[10px] tablet:py-[10px] desktop:py-[10px] font-medium text-card-foreground"
              >
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            {BUILT_IN_FIELD_TYPES.map((type) => {
              const info = FIELD_TYPE_INFO[type] ?? FALLBACK;
              return (
                <tr key={type} className="border-b border-border last:border-b-0">
                  <td className="px-[14px] tablet:px-[14px] desktop:px-[14px] py-[10px] tablet:py-[10px] desktop:py-[10px] align-top font-mono text-[12.5px] tablet:text-[12.5px] desktop:text-[12.5px]">
                    {type}
                  </td>
                  <td className="px-[14px] tablet:px-[14px] desktop:px-[14px] py-[10px] tablet:py-[10px] desktop:py-[10px] align-top text-muted-foreground">
                    <p>{info.description}</p>
                    {info.note && (
                      <p className="mt-[4px] tablet:mt-[4px] desktop:mt-[4px] text-[12px] tablet:text-[12px] desktop:text-[12px]">
                        {info.note}
                      </p>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-[13px] tablet:text-[13px] desktop:text-[13px] text-muted-foreground">
        For the exact per-type config shape (which properties each type accepts), see the{" "}
        <code className="rounded-[4px] tablet:rounded-[4px] desktop:rounded-[4px] bg-muted px-[4px] tablet:px-[4px] desktop:px-[4px] py-[2px] tablet:py-[2px] desktop:py-[2px] text-[13px] tablet:text-[13px] desktop:text-[13px]">
          FieldConfig
        </code>{" "}
        union in{" "}
        <code className="rounded-[4px] tablet:rounded-[4px] desktop:rounded-[4px] bg-muted px-[4px] tablet:px-[4px] desktop:px-[4px] py-[2px] tablet:py-[2px] desktop:py-[2px] text-[13px] tablet:text-[13px] desktop:text-[13px]">
          form-builder-spec.md
        </code>
        , or a working config for several of these under{" "}
        <Link href="/examples" className="underline underline-offset-2 hover:text-foreground">
          Examples
        </Link>
        .
      </p>
    </div>
  );
}
