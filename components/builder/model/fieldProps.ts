import type { FieldType } from "@/form-builder";
import { builder } from "@/locales/en/builder";

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
  | "json"
  | "optionsFrom";

export type PropDescriptor = {
  key: string;
  label: string;
  control: PropControl;
  /** Options for `control: "select"`. */
  options?: { label: string; value: string }[];
  /** Which siblings a `control: "fieldRef"` may reference. */
  refKind?:
    | "otp"
    | "countrySource"
    | "optionsSource"
    | "textFamily"
    | "dateSource"
    | "timeSource"
    | "sameType"
    | "any";
  /** `control: "condition"`: offer the is valid / is invalid operators. */
  validityOps?: boolean;
  /** Props to clear when this one is set (mutually exclusive pairs). */
  clears?: string[];
  /** Native constraints for `control: "number"`. */
  min?: number;
  max?: number;
  step?: number;
  integer?: boolean;
  help?: string;
};

const P = builder.props.fields;

// Shared identity/behavior props. Order matters — this is render order in the editor.
const IDENTITY: PropDescriptor[] = [
  { key: "name", label: P.name.label, control: "text", help: P.name.help },
  { key: "label", label: P.label.label, control: "text" },
  { key: "description", label: P.description.label, control: "text" },
  { key: "placeholder", label: P.placeholder.label, control: "text" },
];

const BEHAVIOR: PropDescriptor[] = [
  { key: "required", label: P.required.label, control: "boolean" },
  { key: "disabled", label: P.disabled.label, control: "boolean" },
  { key: "width", label: P.width.label, control: "width" },
  { key: "visibleWhen", label: P.visibleWhen.label, control: "condition" },
  {
    key: "disabledWhen",
    label: P.disabledWhen.label,
    control: "condition",
    validityOps: true,
    clears: ["enabledWhen"],
  },
  {
    key: "enabledWhen",
    label: P.enabledWhen.label,
    control: "condition",
    validityOps: true,
    clears: ["disabledWhen"],
    help: P.enabledWhen.help,
  },
  {
    key: "enabledWhenVerified",
    label: P.enabledWhenVerified.label,
    control: "fieldRef",
    refKind: "otp",
    help: P.enabledWhenVerified.help,
  },
];

/** Full base descriptor set for standard input fields. */
const BASE: PropDescriptor[] = [...IDENTITY, ...BEHAVIOR];

const OPTIONS: PropDescriptor = { key: "options", label: P.options.label, control: "options" };

// Only on types the engine allows as copy targets (no phone/otp/password/
// file/signature/group/layout types).
const COPY_FROM: PropDescriptor = {
  key: "copyFrom",
  label: P.copyFrom.label,
  control: "fieldRef",
  refKind: "sameType",
  help: P.copyFrom.help,
};

const AS_OPTIONS = [
  { label: P.as.options.h1, value: "h1" },
  { label: P.as.options.h2, value: "h2" },
  { label: P.as.options.p, value: "p" },
  { label: P.as.options.divider, value: "divider" },
];

// Button `variant` values are the shadcn Button component's own enum, not
// display copy — the identifier IS the label, so it's excluded from the
// dictionary the same way field names/ids are.
const VARIANT_OPTIONS = ["default", "destructive", "outline", "secondary", "ghost", "link"].map((v) => ({
  label: v,
  value: v,
}));

/**
 * Editable props per built-in field type, mirroring the `FieldConfig` union in
 * form-builder/core/types.ts. Drives the generic prop editor (Phase 4).
 */
export const FIELD_PROPS: Record<FieldType, PropDescriptor[]> = {
  text: [...BASE, COPY_FROM, { key: "rules", label: P.rules.label, control: "rules" }],
  email: [...BASE, COPY_FROM, { key: "rules", label: P.rules.label, control: "rules" }],
  textarea: [...BASE, COPY_FROM, { key: "rules", label: P.rules.label, control: "rules" }],
  password: [
    ...BASE,
    { key: "rules", label: P.rules.label, control: "rules" },
    { key: "complexity", label: P.complexity.label, control: "complexity" },
  ],
  masked: [
    ...BASE,
    COPY_FROM,
    { key: "mask", label: P.mask.label, control: "mask", help: P.mask.help },
    { key: "message", label: P.message.label, control: "text" },
  ],
  number: [
    ...BASE,
    COPY_FROM,
    { key: "min", label: P.min.label, control: "number" },
    { key: "max", label: P.max.label, control: "number" },
    { key: "step", label: P.step.label, control: "number" },
  ],
  otp: [
    ...BASE,
    { key: "length", label: P.length.label, control: "number", integer: true, min: 1, help: P.length.help },
    { key: "dependsOn", label: P.dependsOn.label, control: "fieldRef", refKind: "any", help: P.dependsOn.help },
  ],
  phone: [
    ...BASE,
    { key: "defaultCountry", label: P.defaultCountry.label, control: "countryCode" },
    { key: "preferredCountries", label: P.preferredCountries.label, control: "countryList" },
    { key: "countryFrom", label: P.countryFrom.label, control: "fieldRef", refKind: "countrySource" },
  ],
  select: [
    ...BASE,
    COPY_FROM,
    { ...OPTIONS, clears: ["optionsFrom"] },
    {
      key: "optionsFrom",
      label: P.optionsFrom.label,
      control: "optionsFrom",
      clears: ["options"],
      help: P.optionsFrom.help,
    },
    { key: "searchable", label: P.searchable.label, control: "boolean" },
    { key: "multiple", label: P.multiple.label, control: "boolean" },
  ],
  country: [
    ...BASE,
    COPY_FROM,
    { key: "countries", label: P.countries.label, control: "countryList" },
    { key: "preferredCountries", label: P.preferredCountries.label, control: "countryList" },
  ],
  radio: [...BASE, COPY_FROM, OPTIONS],
  segmented: [...BASE, COPY_FROM, OPTIONS],
  checkbox: [...BASE, COPY_FROM, { ...OPTIONS, help: P.options.help.checkbox }],
  switch: [...BASE, COPY_FROM, { ...OPTIONS, help: P.options.help.switch }],
  date: [
    ...BASE,
    COPY_FROM,
    { key: "range", label: P.range.label, control: "boolean" },
    { key: "minDate", label: P.minDate.label, control: "date" },
    { key: "maxDate", label: P.maxDate.label, control: "date" },
    {
      key: "minDateField",
      label: P.minDateField.label,
      control: "fieldRef",
      refKind: "dateSource",
      help: P.minDateField.help,
    },
    {
      key: "maxDateField",
      label: P.maxDateField.label,
      control: "fieldRef",
      refKind: "dateSource",
      help: P.maxDateField.help,
    },
  ],
  time: [
    ...BASE,
    COPY_FROM,
    { key: "minTime", label: P.minTime.label, control: "time" },
    { key: "maxTime", label: P.maxTime.label, control: "time" },
    { key: "stepMinutes", label: P.stepMinutes.label, control: "number", integer: true, min: 1 },
    {
      key: "minTimeField",
      label: P.minTimeField.label,
      control: "fieldRef",
      refKind: "timeSource",
      help: P.minTimeField.help,
    },
    {
      key: "maxTimeField",
      label: P.maxTimeField.label,
      control: "fieldRef",
      refKind: "timeSource",
      help: P.maxTimeField.help,
    },
  ],
  rating: [
    ...BASE,
    COPY_FROM,
    { key: "max", label: P.max.stars.label, control: "number", integer: true, min: 2, max: 10, help: P.max.stars.help },
  ],
  slider: [
    ...BASE,
    COPY_FROM,
    { key: "min", label: P.min.label, control: "number" },
    { key: "max", label: P.max.label, control: "number" },
    { key: "step", label: P.step.label, control: "number" },
  ],
  signature: [
    ...BASE,
    { key: "penColor", label: P.penColor.label, control: "penColor" },
    { key: "heightPx", label: P.heightPx.label, control: "number", integer: true, min: 1 },
  ],
  file: [
    ...BASE,
    { key: "accept", label: P.accept.label, control: "text", help: P.accept.help },
    { key: "maxSizeMB", label: P.maxSizeMB.label, control: "number", min: 0 },
    { key: "multiple", label: P.multiple.label, control: "boolean" },
  ],
  // Layout / non-standard: opt out of the input BASE set.
  hidden: [
    { key: "name", label: P.name.label, control: "text" },
    { key: "value", label: P.value.label, control: "json", help: P.value.help },
  ],
  static: [
    { key: "name", label: P.name.label, control: "text" },
    {
      key: "content",
      label: P.content.label,
      control: "textarea",
      help: P.content.help,
    },
    { key: "as", label: P.as.label, control: "select", options: AS_OPTIONS },
    { key: "visibleWhen", label: P.visibleWhen.label, control: "condition" },
    { key: "width", label: P.width.label, control: "width" },
  ],
  // Submit is gated by formState.isValid, but the runtime (FieldGate) still
  // honors visibleWhen/disabledWhen/disabled/enabledWhenVerified on it.
  submit: [
    { key: "name", label: P.name.label, control: "text" },
    { key: "text", label: P.text.label, control: "text" },
    { key: "variant", label: P.variant.label, control: "select", options: VARIANT_OPTIONS },
    { key: "disabled", label: P.disabled.label, control: "boolean" },
    { key: "visibleWhen", label: P.visibleWhen.label, control: "condition" },
    {
      key: "disabledWhen",
      label: P.disabledWhen.label,
      control: "condition",
      validityOps: true,
      clears: ["enabledWhen"],
    },
    {
      key: "enabledWhen",
      label: P.enabledWhen.label,
      control: "condition",
      validityOps: true,
      clears: ["disabledWhen"],
      help: P.enabledWhen.help,
    },
    {
      key: "enabledWhenVerified",
      label: P.enabledWhenVerified.label,
      control: "fieldRef",
      refKind: "otp",
      help: P.enabledWhenVerified.help,
    },
    { key: "width", label: P.width.label, control: "width" },
  ],
  group: [
    ...BASE,
    { key: "min", label: P.min.rows.label, control: "number" },
    { key: "max", label: P.max.rows.label, control: "number" },
  ],
};
