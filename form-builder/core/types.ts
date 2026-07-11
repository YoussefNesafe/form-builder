export type Option = { label: string; value: string | number; disabled?: boolean };

export type TextRules = {
  minLength?: number;
  maxLength?: number;
  pattern?: string; // string, not RegExp — JSON-serializable
  message?: string; // custom error for pattern
  trim?: boolean; // trim before validating; parsed payload is trimmed too
  allow?: string; // character-class body (e.g. "A-Za-z ") — other chars are blocked while typing
  // Cross-field equality (confirm password/email): value must equal the named
  // sibling's. Enforced by a form-level refine, never the field's own schema
  // (the isValid oracle parses fields in isolation).
  matches?: string;
  matchesMessage?: string; // custom error for matches
};

export type PasswordComplexity = {
  uppercase?: boolean;
  lowercase?: boolean;
  number?: boolean;
  special?: boolean;
  minLength?: number;
};

export type ButtonVariant = "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";

export type Condition = {
  field: string;
  equals?: unknown;
  notEquals?: unknown;
  in?: unknown[];
  // Matches when the source field's schema-validity === isValid. Only allowed
  // in disabledWhen/enabledWhen: visibility drives the validation schema, so
  // validity-driven visibility would feed back into itself.
  isValid?: boolean;
};

/**
 * One condition, an AND-list, or OR-of-AND-groups (DNF). Any boolean
 * combination is expressible without recursive trees, which keeps the
 * builder UI flat.
 */
export type ConditionSpec = Condition | Condition[] | { anyOf: Condition[][] };

export type FieldWidth = "full" | "half" | "third" | "quarter";

/**
 * Field width per breakpoint. A plain string applies to every breakpoint;
 * the object form sets each breakpoint independently (unset = full).
 */
export type ResponsiveFieldWidth =
  | FieldWidth
  | { mobile?: FieldWidth; tablet?: FieldWidth; desktop?: FieldWidth };

export type BaseField = {
  name: string;
  label?: string;
  description?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  // Value operators only — the validator rejects isValid here.
  visibleWhen?: ConditionSpec;
  disabledWhen?: ConditionSpec;
  // Inverse of disabledWhen (disabled while the spec does NOT match) — reads
  // straight for "enabled once X is valid". Mutually exclusive with disabledWhen.
  enabledWhen?: ConditionSpec;
  // Field stays disabled until the named otp field is verified.
  enabledWhenVerified?: string;
  // Mirror a same-type sibling until the user edits this field; the source
  // wins again on its next change (same semantics as phone countryFrom).
  copyFrom?: string;
  width?: ResponsiveFieldWidth;
};

export const BUILT_IN_FIELD_TYPES = [
  "text",
  "email",
  "password",
  "textarea",
  "masked",
  "number",
  "otp",
  "phone",
  "select",
  "country",
  "radio",
  "segmented",
  "checkbox",
  "switch",
  "date",
  "time",
  "rating",
  "slider",
  "signature",
  "file",
  "hidden",
  "static",
  "group",
  "submit",
] as const;

export type FieldConfig =
  | (BaseField & { type: "text" | "email" | "textarea"; rules?: TextRules })
  | (BaseField & { type: "password"; rules?: TextRules; complexity?: PasswordComplexity })
  // Stored value is RAW (token chars only, e.g. "4111111111111111"); the mask
  // ("#" digit, "A" letter, "*" alphanumeric, others literal) is presentation.
  | (BaseField & { type: "masked"; mask: string; message?: string })
  | (BaseField & { type: "number"; min?: number; max?: number; step?: number })
  | (BaseField & { type: "otp"; length: number; dependsOn?: string })
  | (BaseField & { type: "phone"; defaultCountry?: string; preferredCountries?: string[]; countryFrom?: string })
  // Exactly one of options/optionsFrom (validator-enforced). optionsFrom
  // derives the option list from a sibling's current value via the config-
  // carried map (CMS-friendly); a missing key yields an empty, disabled select.
  | (BaseField & {
      type: "select";
      options?: Option[];
      optionsFrom?: { field: string; map: Record<string, Option[]> };
      searchable?: boolean;
      multiple?: boolean;
    })
  // Values are ISO 3166-1 alpha-2 codes; valid as a phone countryFrom source.
  | (BaseField & { type: "country"; countries?: string[]; preferredCountries?: string[] })
  | (BaseField & { type: "radio"; options: Option[] })
  | (BaseField & { type: "segmented"; options: Option[] }) // radio semantics, button-group presentation
  | (BaseField & { type: "checkbox" | "switch"; options?: Option[] }) // options => checkbox group
  // minDateField/maxDateField bound against a sibling date field's current
  // value (cross-field "end after start") — form-level refine, non-range only.
  | (BaseField & {
      type: "date";
      range?: boolean;
      minDate?: string;
      maxDate?: string;
      minDateField?: string;
      maxDateField?: string;
    })
  // Times are plain zero-padded "HH:mm" strings, compared lexicographically
  // (same convention as dates — no Date math).
  | (BaseField & {
      type: "time";
      minTime?: string;
      maxTime?: string;
      stepMinutes?: number;
      minTimeField?: string;
      maxTimeField?: string;
    })
  | (BaseField & { type: "rating"; max?: number }) // 1..max stars, max defaults to 5
  | (BaseField & { type: "slider"; min: number; max: number; step?: number })
  // Value is a PNG data URL ("" until the user signs).
  | (BaseField & { type: "signature"; penColor?: string; heightPx?: number })
  | (BaseField & { type: "file"; accept?: string; maxSizeMB?: number; multiple?: boolean })
  | (BaseField & { type: "hidden"; value: unknown })
  | (BaseField & { type: "static"; content: string; as?: "h1" | "h2" | "p" | "divider" })
  | (BaseField & { type: "group"; fields: AnyFieldConfig[]; min?: number; max?: number })
  | (BaseField & { type: "submit"; text: string; variant?: ButtonVariant });

export type FieldType = FieldConfig["type"];

/**
 * Project-specific field types registered via registerField(). Validated as
 * BaseField only; values pass through validation as unknown (the consuming
 * component owns any richer validation).
 */
export type CustomFieldConfig = BaseField & { type: string } & Record<string, unknown>;

export type AnyFieldConfig = FieldConfig | CustomFieldConfig;

export function isBuiltInField(field: AnyFieldConfig): field is FieldConfig {
  return (BUILT_IN_FIELD_TYPES as readonly string[]).includes(field.type);
}

export type StepConfig = {
  title: string;
  // Required unless review: true (validator-enforced exactly-one).
  fieldNames?: string[];
  // Read-only summary of all visible fields from earlier visible steps,
  // with per-step edit links. A review step owns no fields.
  review?: boolean;
  // Value operators only (validator rejects isValid — visibility drives the
  // schema). A hidden step's fields are condition-hidden everywhere:
  // excluded from validation, stripped from the payload, skipped by the
  // stepper.
  visibleWhen?: ConditionSpec;
};

export type FormConfig = {
  id: string;
  title?: string;
  description?: string;
  fields: AnyFieldConfig[];
  steps?: StepConfig[];
};

export type FormValues = Record<string, unknown>;
