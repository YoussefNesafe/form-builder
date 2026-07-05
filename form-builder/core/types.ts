export type Option = { label: string; value: string | number; disabled?: boolean };

export type TextRules = {
  minLength?: number;
  maxLength?: number;
  pattern?: string; // string, not RegExp — JSON-serializable
  message?: string; // custom error for pattern
};

export type ButtonVariant = "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";

export type Condition = {
  field: string;
  equals?: unknown;
  notEquals?: unknown;
  in?: unknown[];
};

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
  colSpan?: 1 | 2 | 3 | 4;
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
  "slider",
  "file",
  "hidden",
  "static",
  "group",
  "submit",
] as const;

export type FieldConfig =
  | (BaseField & { type: "text" | "email" | "password" | "textarea"; rules?: TextRules })
  | (BaseField & { type: "number"; min?: number; max?: number; step?: number })
  | (BaseField & { type: "otp"; length: number; dependsOn?: string })
  | (BaseField & { type: "phone"; defaultCountry?: string; preferredCountries?: string[] })
  | (BaseField & { type: "select"; options: Option[]; searchable?: boolean; multiple?: boolean })
  | (BaseField & { type: "radio"; options: Option[] })
  | (BaseField & { type: "checkbox" | "switch"; options?: Option[] }) // options => checkbox group
  | (BaseField & { type: "date"; range?: boolean; minDate?: string; maxDate?: string })
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
