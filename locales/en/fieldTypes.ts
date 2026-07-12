import type { FieldType } from "@/form-builder";

export type FieldTypeCopy = {
  label: string;
  description: string;
  note?: string;
};

/**
 * Single copy source for every built-in field type's display text — consumed
 * by the docs field-types reference table and, as of slice 5, the visual
 * builder's add-field menu, field-list rows, and prop-editor header
 * (components/builder/**). Keys are the FieldType union imported from the
 * engine's public API (`@/form-builder`) — never from components/builder/**,
 * which is a one-way consumer of this dictionary, not a source for it.
 *
 * `label` used to be seeded from FIELD_META in
 * components/builder/model/fieldMeta.ts; as of slice 5 that file no longer
 * carries labels at all — this dictionary is the sole source, and FIELD_META
 * is structure-only (group/icon). `description`/`note` are seeded verbatim
 * from the FIELD_TYPE_INFO map that used to live in
 * app/(site)/docs/field-types/page.tsx.
 */
export const fieldTypes: Record<FieldType, FieldTypeCopy> = {
  text: { label: "Text", description: "Single-line text input." },
  email: { label: "Email", description: "Text input with email-format validation." },
  password: {
    label: "Password",
    description: "Text input with a show/hide toggle.",
    note: "Optional complexity rules (min length, upper/lower/digit/symbol requirements) via complexity.",
  },
  textarea: { label: "Textarea", description: "Multi-line text input." },
  masked: {
    label: "Masked",
    description: "Pattern-masked text input (# digit, A letter, * alphanumeric, other characters literal).",
    note: "Stores the raw token characters — the mask is presentation-only, not part of the value.",
  },
  number: { label: "Number", description: "Numeric input with optional min, max, and step." },
  otp: {
    label: "OTP",
    description: "One-time-passcode input (shadcn input-otp) with a configurable length.",
    note: "dependsOn gates it on a sibling field's value and invalidates the verified code when that value changes.",
  },
  phone: {
    label: "Phone",
    description: "International phone input (react-phone-number-input) with a country flag dropdown.",
    note: "countryFrom syncs the selected country from a sibling country or single-select field — the source always wins over a manual pick until it changes again.",
  },
  select: {
    label: "Select",
    description: "Dropdown, or a searchable combobox when searchable is set; supports multiple.",
    note: "optionsFrom can derive the option list from another field's current value instead of a static options array.",
  },
  country: {
    label: "Country",
    description: "Searchable combobox of ISO 3166-1 alpha-2 countries, with flags.",
    note: "Value is ISO alpha-2 by construction, so it's always a valid phone countryFrom source. Like an optional radio, it can't be cleared once set — the combobox has no clear row.",
  },
  radio: { label: "Radio", description: "Exclusive choice from a set of options." },
  segmented: {
    label: "Segmented",
    description: "Radio semantics (radix RadioGroup) rendered as a joined button group.",
    note: "An optional segmented field can't be cleared once set — same as radio.",
  },
  checkbox: { label: "Checkbox", description: "Boolean checkbox, or a checkbox group when options is set." },
  switch: {
    label: "Switch",
    description: "Boolean toggle switch.",
    note: "Always a single boolean value — options are not supported (use checkbox for a group).",
  },
  date: {
    label: "Date",
    description: "Single date or range picker (react-day-picker).",
    note: 'Value is a plain "yyyy-MM-dd" string (or a {from, to} pair for range), compared by date part — never epoch math.',
  },
  time: {
    label: "Time",
    description: "Native time input.",
    note: 'Value is a zero-padded "HH:mm" string, compared lexicographically — same convention as dates.',
  },
  rating: {
    label: "Rating",
    description: "1..max star rating (default max 5).",
    note: "Clicking the current value clears it when the field is optional.",
  },
  slider: { label: "Slider", description: "Numeric slider (shadcn Slider) with min, max, and step." },
  signature: {
    label: "Signature",
    description: "Draw-to-sign canvas (signature_pad); value is a PNG data URL.",
    note: "Not keyboard-accessible — drawing is inherently pointer/touch-only, with no keyboard fallback.",
  },
  file: { label: "File", description: "File upload with progress; accept, maxSizeMB, and multiple." },
  hidden: { label: "Hidden", description: "Not rendered; carries a static value along with the rest of the form's values." },
  static: { label: "Static text", description: "Non-field content block — heading, paragraph, or divider. Has no value." },
  group: {
    label: "Group (repeatable)",
    description: 'Repeatable sub-array of fields (e.g. "add another team member"), with min/max.',
    note: "Known v1 limitation: visibleWhen/disabledWhen conditions on fields nested inside a group are not skipped by validation.",
  },
  submit: { label: "Submit button", description: "Submit button with configurable text and variant." },
} as const;
