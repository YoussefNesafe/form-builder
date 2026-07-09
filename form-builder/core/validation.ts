import { z } from "zod";
import { isValidPhoneNumber } from "libphonenumber-js";
import type { Messages } from "./messages";
import { getPasswordChecks } from "./password";
import { isBuiltInField } from "./types";
import type { AnyFieldConfig, FieldConfig, FormConfig, Option, TextRules } from "./types";

type FieldSchema = z.ZodType | null;

function optionValueSchema(options: Option[], requiredMessage?: string): z.ZodType {
  const error = requiredMessage;
  const hasString = options.some((option) => typeof option.value === "string");
  const hasNumber = options.some((option) => typeof option.value === "number");
  if (hasString && hasNumber) return z.union([z.string(), z.number()], { error });
  return hasNumber ? z.number({ error }) : z.string({ error });
}

function optionalEmptyable(schema: z.ZodType): z.ZodType {
  // Optional text-like fields default to "" — treat empty string as absent.
  return z.preprocess((value) => (value === "" ? undefined : value), schema.optional());
}

function optionalClearable(schema: z.ZodType): z.ZodType {
  // Cleared number inputs yield NaN, clearable selects/radios yield null.
  return z.preprocess(
    (value) => (value === null || value === "" || (typeof value === "number" && Number.isNaN(value)) ? undefined : value),
    schema.optional(),
  );
}

// Outermost so every check (including required min(1)) sees the trimmed
// value — "   " fails required, and the parsed payload comes out trimmed.
function withTrim(rules: TextRules | undefined, schema: z.ZodType): z.ZodType {
  if (!rules?.trim) return schema;
  return z.preprocess((value) => (typeof value === "string" ? value.trim() : value), schema);
}

function applyTextRules(schema: z.ZodString, rules: TextRules | undefined, messages: Messages): z.ZodString {
  let result = schema;
  if (rules?.minLength !== undefined) result = result.min(rules.minLength, messages.minLength(rules.minLength));
  if (rules?.maxLength !== undefined) result = result.max(rules.maxLength, messages.maxLength(rules.maxLength));
  if (rules?.pattern !== undefined) {
    // Config validation rejects invalid patterns, but direct useDynamicForm
    // callers can skip it — a bad pattern must not throw inside the resolver
    // and brick the form. Skip the rule instead.
    try {
      result = result.regex(new RegExp(rules.pattern), rules.message ?? messages.pattern);
    } catch {
      // skip unparseable pattern
    }
  }
  return result;
}

// Date values are calendar dates ("yyyy-MM-dd"). Boundary checks compare the
// date part lexicographically (valid for ISO dates) — comparing epoch instants
// would mix local-midnight picks with UTC-midnight config bounds and reject
// legal boundary days in any non-UTC timezone.
function datePart(value: string): string {
  return value.slice(0, 10);
}

function isoDateSchema(field: Extract<FieldConfig, { type: "date" }>, messages: Messages): z.ZodType<string> {
  let schema = z
    .string({ error: field.required ? messages.required : undefined })
    .refine(
      (value) => /^\d{4}-\d{2}-\d{2}(T|$)/.test(value) && !Number.isNaN(Date.parse(datePart(value))),
      messages.invalidDate,
    );
  if (field.minDate !== undefined) {
    const min = datePart(field.minDate);
    schema = schema.refine((value) => datePart(value) >= min, messages.min(field.minDate));
  }
  if (field.maxDate !== undefined) {
    const max = datePart(field.maxDate);
    schema = schema.refine((value) => datePart(value) <= max, messages.max(field.maxDate));
  }
  return schema;
}

function fileSchema(field: Extract<FieldConfig, { type: "file" }>, messages: Messages): z.ZodType {
  let schema: z.ZodType = z.instanceof(File, { error: messages.required });
  if (field.maxSizeMB !== undefined) {
    const maxBytes = field.maxSizeMB * 1024 * 1024;
    schema = schema.refine((file) => (file as File).size <= maxBytes, messages.fileSize(field.maxSizeMB));
  }
  return schema;
}

export type OtpVerifiedChecker = (fieldName: string, code: string) => boolean;

export function toZodSchema(
  field: FieldConfig,
  messages: Messages,
  otpVerified?: OtpVerifiedChecker,
): FieldSchema {
  switch (field.type) {
    case "static":
    case "submit":
      return null;

    case "hidden":
      return z.unknown();

    case "text":
    case "password":
    case "textarea": {
      const base = field.required ? z.string({ error: messages.required }).min(1, messages.required) : z.string();
      let schema: z.ZodType = applyTextRules(base, field.rules, messages);
      if (field.type === "password" && field.complexity) {
        for (const check of getPasswordChecks(field.complexity, messages)) {
          schema = schema.refine((value) => check.test(value as string), check.label);
        }
      }
      return withTrim(field.rules, field.required ? schema : optionalEmptyable(schema));
    }

    case "email": {
      const base = field.required ? z.string({ error: messages.required }).min(1, messages.required) : z.string();
      const schema = applyTextRules(base, field.rules, messages).refine(
        (value) => z.email().safeParse(value).success,
        messages.email,
      );
      return withTrim(field.rules, field.required ? schema : optionalEmptyable(schema));
    }

    case "number": {
      let schema = z.number({ error: messages.required });
      if (field.min !== undefined) schema = schema.min(field.min, messages.min(field.min));
      if (field.max !== undefined) schema = schema.max(field.max, messages.max(field.max));
      return field.required ? schema : optionalClearable(schema);
    }

    case "otp": {
      let schema = z.string().length(field.length, messages.otpLength(field.length));
      // Checker present only when the host wires onVerifyOtp — then the code
      // must match the server-verified one, not merely have the right length.
      if (otpVerified) {
        schema = schema.refine((code) => otpVerified(field.name, code), messages.otpNotVerified);
      }
      return field.required ? schema : optionalEmptyable(schema);
    }

    case "phone": {
      const base = field.required ? z.string({ error: messages.required }).min(1, messages.required) : z.string();
      const schema = base.refine((value) => isValidPhoneNumber(value), messages.invalidPhone);
      return field.required ? schema : optionalEmptyable(schema);
    }

    case "select": {
      if (field.multiple) {
        const schema = z.array(optionValueSchema(field.options));
        return field.required ? schema.min(1, messages.required) : schema.optional();
      }
      const value = optionValueSchema(field.options, field.required ? messages.required : undefined);
      return field.required ? value : optionalClearable(value);
    }

    case "radio": {
      const value = optionValueSchema(field.options, field.required ? messages.required : undefined);
      return field.required ? value : optionalClearable(value);
    }

    case "checkbox": {
      if (field.options?.length) {
        const schema = z.array(optionValueSchema(field.options));
        return field.required ? schema.min(1, messages.required) : schema.optional();
      }
      return field.required ? z.literal(true, { error: messages.required }) : z.boolean().optional();
    }

    case "switch":
      return field.required ? z.literal(true, { error: messages.required }) : z.boolean().optional();

    case "date": {
      if (field.range) {
        const iso = isoDateSchema(field, messages);
        // Root-pathed refines: Controller reads fieldState.error at the field
        // name, so nested from/to issues would render as empty error text.
        const schema = z
          .object({ from: iso, to: iso.optional() }, { error: messages.required })
          .refine((range) => range.to !== undefined, messages.required)
          .refine(
            (range) => range.to === undefined || datePart(range.from) <= datePart(range.to),
            messages.invalidDate,
          );
        return field.required ? schema : schema.optional();
      }
      const schema = isoDateSchema(field, messages);
      return field.required ? schema : optionalEmptyable(schema);
    }

    case "time": {
      // Zero-padded "HH:mm" strings order lexicographically — same convention
      // as calendar dates, no Date math.
      const base = field.required ? z.string({ error: messages.required }).min(1, messages.required) : z.string();
      let schema: z.ZodType = base.refine(
        (value) => /^([01]\d|2[0-3]):[0-5]\d$/.test(value as string),
        messages.invalidTime,
      );
      if (field.minTime !== undefined) {
        const min = field.minTime;
        schema = schema.refine((value) => (value as string) >= min, messages.min(min));
      }
      if (field.maxTime !== undefined) {
        const max = field.maxTime;
        schema = schema.refine((value) => (value as string) <= max, messages.max(max));
      }
      return field.required ? schema : optionalEmptyable(schema);
    }

    case "slider": {
      // Always required: the slider always has a value (defaults to min).
      let schema = z.number({ error: messages.required });
      schema = schema.min(field.min, messages.min(field.min)).max(field.max, messages.max(field.max));
      return schema;
    }

    case "file": {
      if (field.multiple) {
        // Size check refines at the ARRAY root: a per-item refine would land
        // the issue at `name.0`, where fieldState.error has no message.
        const base = z.array(z.instanceof(File, { error: messages.required }));
        const withMin = field.required ? base.min(1, messages.required) : base;
        const maxBytes = field.maxSizeMB !== undefined ? field.maxSizeMB * 1024 * 1024 : undefined;
        const schema =
          maxBytes === undefined
            ? withMin
            : withMin.refine(
                (files) => files.every((file) => file.size <= maxBytes),
                messages.fileSize(field.maxSizeMB as number),
              );
        return field.required ? schema : schema.optional();
      }
      const single = fileSchema(field, messages);
      return field.required ? single : single.optional();
    }

    case "group": {
      // No otp checker inside rows: runtime names are row-prefixed, so the
      // verified registry could never match — group otps stay length-only.
      const row = buildFieldsSchema(field.fields, messages);
      let schema = z.array(row);
      if (field.min !== undefined) schema = schema.min(field.min, messages.min(field.min));
      if (field.max !== undefined) schema = schema.max(field.max, messages.max(field.max));
      return schema;
    }
  }
}

export function buildFieldsSchema(
  fields: AnyFieldConfig[],
  messages: Messages,
  otpVerified?: OtpVerifiedChecker,
): z.ZodObject {
  const shape: Record<string, z.ZodType> = {};
  for (const field of fields) {
    // Custom registered types pass through — their component owns validation.
    const schema = isBuiltInField(field) ? toZodSchema(field, messages, otpVerified) : z.unknown().optional();
    if (schema) shape[field.name] = schema;
  }
  return z.object(shape);
}

export function buildFormSchema(config: FormConfig, messages: Messages, otpVerified?: OtpVerifiedChecker): z.ZodObject {
  return buildFieldsSchema(config.fields, messages, otpVerified);
}
