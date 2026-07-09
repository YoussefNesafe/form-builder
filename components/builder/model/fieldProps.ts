import type { FieldType } from "@/form-builder";

export type PropControl =
  | "text"
  | "number"
  | "boolean"
  | "textarea"
  | "select"
  | "options"
  | "condition"
  | "width"
  | "fieldRef"
  | "countryCode"
  | "countryList"
  | "mask"
  | "rules"
  | "complexity"
  | "penColor"
  | "date"
  | "time"
  | "json";

export type PropDescriptor = {
  key: string;
  label: string;
  control: PropControl;
  /** Options for `control: "select"`. */
  options?: { label: string; value: string }[];
  /** Which siblings a `control: "fieldRef"` may reference. */
  refKind?: "otp" | "countrySource" | "any";
  /** Native constraints for `control: "number"`. */
  min?: number;
  max?: number;
  step?: number;
  integer?: boolean;
  help?: string;
};

// Shared identity/behavior props. Order matters — this is render order in the editor.
const IDENTITY: PropDescriptor[] = [
  { key: "name", label: "Name", control: "text", help: "Unique key in the submitted values. No dots." },
  { key: "label", label: "Label", control: "text" },
  { key: "description", label: "Description", control: "text" },
  { key: "placeholder", label: "Placeholder", control: "text" },
];

const BEHAVIOR: PropDescriptor[] = [
  { key: "required", label: "Required", control: "boolean" },
  { key: "disabled", label: "Disabled", control: "boolean" },
  { key: "width", label: "Width", control: "width" },
  { key: "visibleWhen", label: "Visible when", control: "condition" },
  { key: "disabledWhen", label: "Disabled when", control: "condition" },
  {
    key: "enabledWhenVerified",
    label: "Enabled when verified",
    control: "fieldRef",
    refKind: "otp",
    help: "Stays disabled until the named OTP field is verified.",
  },
];

/** Full base descriptor set for standard input fields. */
const BASE: PropDescriptor[] = [...IDENTITY, ...BEHAVIOR];

const OPTIONS: PropDescriptor = { key: "options", label: "Options", control: "options" };

const AS_OPTIONS = [
  { label: "Heading 1", value: "h1" },
  { label: "Heading 2", value: "h2" },
  { label: "Paragraph", value: "p" },
  { label: "Divider", value: "divider" },
];

const VARIANT_OPTIONS = ["default", "destructive", "outline", "secondary", "ghost", "link"].map((v) => ({
  label: v,
  value: v,
}));

/**
 * Editable props per built-in field type, mirroring the `FieldConfig` union in
 * form-builder/core/types.ts. Drives the generic prop editor (Phase 4).
 */
export const FIELD_PROPS: Record<FieldType, PropDescriptor[]> = {
  text: [...BASE, { key: "rules", label: "Validation rules", control: "rules" }],
  email: [...BASE, { key: "rules", label: "Validation rules", control: "rules" }],
  textarea: [...BASE, { key: "rules", label: "Validation rules", control: "rules" }],
  password: [
    ...BASE,
    { key: "rules", label: "Validation rules", control: "rules" },
    { key: "complexity", label: "Password complexity", control: "complexity" },
  ],
  masked: [
    ...BASE,
    { key: "mask", label: "Mask", control: "mask", help: "# digit, A letter, * alphanumeric; other chars are literals." },
    { key: "message", label: "Error message", control: "text" },
  ],
  number: [
    ...BASE,
    { key: "min", label: "Min", control: "number" },
    { key: "max", label: "Max", control: "number" },
    { key: "step", label: "Step", control: "number" },
  ],
  otp: [
    ...BASE,
    { key: "length", label: "Length", control: "number", integer: true, min: 1, help: "Number of code digits." },
    { key: "dependsOn", label: "Depends on", control: "fieldRef", refKind: "any", help: "Field that must be valid before sending a code." },
  ],
  phone: [
    ...BASE,
    { key: "defaultCountry", label: "Default country", control: "countryCode" },
    { key: "preferredCountries", label: "Preferred countries", control: "countryList" },
    { key: "countryFrom", label: "Sync country from", control: "fieldRef", refKind: "countrySource" },
  ],
  select: [
    ...BASE,
    OPTIONS,
    { key: "searchable", label: "Searchable", control: "boolean" },
    { key: "multiple", label: "Multiple", control: "boolean" },
  ],
  country: [
    ...BASE,
    { key: "countries", label: "Countries (subset)", control: "countryList" },
    { key: "preferredCountries", label: "Preferred countries", control: "countryList" },
  ],
  radio: [...BASE, OPTIONS],
  segmented: [...BASE, OPTIONS],
  checkbox: [...BASE, { ...OPTIONS, help: "Add options to make it a checkbox group; leave empty for a single checkbox." }],
  switch: [...BASE, { ...OPTIONS, help: "Add options for a multi-switch; leave empty for a single switch." }],
  date: [
    ...BASE,
    { key: "range", label: "Range", control: "boolean" },
    { key: "minDate", label: "Min date", control: "date" },
    { key: "maxDate", label: "Max date", control: "date" },
  ],
  time: [
    ...BASE,
    { key: "minTime", label: "Min time", control: "time" },
    { key: "maxTime", label: "Max time", control: "time" },
    { key: "stepMinutes", label: "Step (minutes)", control: "number", integer: true, min: 1 },
  ],
  rating: [
    ...BASE,
    { key: "max", label: "Max stars", control: "number", integer: true, min: 2, max: 10, help: "2–10, defaults to 5." },
  ],
  slider: [
    ...BASE,
    { key: "min", label: "Min", control: "number" },
    { key: "max", label: "Max", control: "number" },
    { key: "step", label: "Step", control: "number" },
  ],
  signature: [
    ...BASE,
    { key: "penColor", label: "Pen color", control: "penColor" },
    { key: "heightPx", label: "Height (px)", control: "number", integer: true, min: 1 },
  ],
  file: [
    ...BASE,
    { key: "accept", label: "Accept", control: "text", help: 'e.g. ".pdf,.png,.jpg"' },
    { key: "maxSizeMB", label: "Max size (MB)", control: "number", min: 0 },
    { key: "multiple", label: "Multiple", control: "boolean" },
  ],
  // Layout / non-standard: opt out of the input BASE set.
  hidden: [
    { key: "name", label: "Name", control: "text" },
    { key: "value", label: "Value", control: "json", help: "Any JSON value; submitted as-is." },
  ],
  static: [
    { key: "name", label: "Name", control: "text" },
    { key: "content", label: "Content", control: "textarea" },
    { key: "as", label: "Render as", control: "select", options: AS_OPTIONS },
    { key: "visibleWhen", label: "Visible when", control: "condition" },
    { key: "width", label: "Width", control: "width" },
  ],
  // Submit is gated by formState.isValid, but the runtime (FieldGate) still
  // honors visibleWhen/disabledWhen/disabled/enabledWhenVerified on it.
  submit: [
    { key: "name", label: "Name", control: "text" },
    { key: "text", label: "Button text", control: "text" },
    { key: "variant", label: "Variant", control: "select", options: VARIANT_OPTIONS },
    { key: "disabled", label: "Disabled", control: "boolean" },
    { key: "visibleWhen", label: "Visible when", control: "condition" },
    { key: "disabledWhen", label: "Disabled when", control: "condition" },
    {
      key: "enabledWhenVerified",
      label: "Enabled when verified",
      control: "fieldRef",
      refKind: "otp",
      help: "Stays disabled until the named OTP field is verified.",
    },
    { key: "width", label: "Width", control: "width" },
  ],
  group: [
    ...BASE,
    { key: "min", label: "Min rows", control: "number" },
    { key: "max", label: "Max rows", control: "number" },
  ],
};
