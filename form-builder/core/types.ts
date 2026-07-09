export type Option = { label: string; value: string | number; disabled?: boolean };

export type TextRules = {
  minLength?: number;
  maxLength?: number;
  pattern?: string; // string, not RegExp — JSON-serializable
  message?: string; // custom error for pattern
  trim?: boolean; // trim before validating; parsed payload is trimmed too
  allow?: string; // character-class body (e.g. "A-Za-z ") — other chars are blocked while typing
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
};

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
  visibleWhen?: Condition;
  disabledWhen?: Condition;
  // Field stays disabled until the named otp field is verified.
  enabledWhenVerified?: string;
  width?: ResponsiveFieldWidth;
};

export const BUILT_IN_FIELD_TYPES = [
  "text",
  "email",
  "password",
  "textarea",
  "number",
  "otp",
  "phone",
  "select",
  "radio",
  "checkbox",
  "switch",
  "date",
  "time",
  "rating",
  "slider",
  "file",
  "hidden",
  "static",
  "group",
  "submit",
] as const;

export type FieldConfig =
  | (BaseField & { type: "text" | "email" | "textarea"; rules?: TextRules })
  | (BaseField & { type: "password"; rules?: TextRules; complexity?: PasswordComplexity })
  | (BaseField & { type: "number"; min?: number; max?: number; step?: number })
  | (BaseField & { type: "otp"; length: number; dependsOn?: string })
  | (BaseField & { type: "phone"; defaultCountry?: string; preferredCountries?: string[]; countryFrom?: string })
  | (BaseField & { type: "select"; options: Option[]; searchable?: boolean; multiple?: boolean })
  | (BaseField & { type: "radio"; options: Option[] })
  | (BaseField & { type: "checkbox" | "switch"; options?: Option[] }) // options => checkbox group
  | (BaseField & { type: "date"; range?: boolean; minDate?: string; maxDate?: string })
  // Times are plain zero-padded "HH:mm" strings, compared lexicographically
  // (same convention as dates — no Date math).
  | (BaseField & { type: "time"; minTime?: string; maxTime?: string; stepMinutes?: number })
  | (BaseField & { type: "rating"; max?: number }) // 1..max stars, max defaults to 5
  | (BaseField & { type: "slider"; min: number; max: number; step?: number })
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

export type FormConfig = {
  id: string;
  title?: string;
  description?: string;
  fields: AnyFieldConfig[];
  steps?: { title: string; fieldNames: string[] }[];
};

export type FormValues = Record<string, unknown>;
