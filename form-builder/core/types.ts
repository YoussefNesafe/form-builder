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
  colSpan?: 1 | 2 | 3 | 4;
};

export type FieldConfig =
  | (BaseField & { type: "text" | "email" | "password" | "textarea"; rules?: TextRules })
  | (BaseField & { type: "number"; min?: number; max?: number; step?: number })
  | (BaseField & { type: "otp"; length: number })
  | (BaseField & { type: "phone"; defaultCountry?: string; preferredCountries?: string[] })
  | (BaseField & { type: "select"; options: Option[]; searchable?: boolean; multiple?: boolean })
  | (BaseField & { type: "radio"; options: Option[] })
  | (BaseField & { type: "checkbox" | "switch"; options?: Option[] }) // options => checkbox group
  | (BaseField & { type: "date"; range?: boolean; minDate?: string; maxDate?: string })
  | (BaseField & { type: "slider"; min: number; max: number; step?: number })
  | (BaseField & { type: "file"; accept?: string; maxSizeMB?: number; multiple?: boolean })
  | (BaseField & { type: "hidden"; value: unknown })
  | (BaseField & { type: "static"; content: string; as?: "h1" | "h2" | "p" | "divider" })
  | (BaseField & { type: "group"; fields: FieldConfig[]; min?: number; max?: number })
  | (BaseField & { type: "submit"; text: string; variant?: ButtonVariant });

export type FieldType = FieldConfig["type"];

export type FormConfig = {
  id: string;
  title?: string;
  description?: string;
  fields: FieldConfig[];
  steps?: { title: string; fieldNames: string[] }[];
};

export type FormValues = Record<string, unknown>;
