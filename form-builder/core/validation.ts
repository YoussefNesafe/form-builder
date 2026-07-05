import { z } from "zod";
import type { Messages } from "./messages";
import type { FieldConfig, FormConfig, Option, TextRules } from "./types";

type FieldSchema = z.ZodType | null;

function optionValueSchema(options: Option[]): z.ZodType {
  const hasString = options.some((option) => typeof option.value === "string");
  const hasNumber = options.some((option) => typeof option.value === "number");
  if (hasString && hasNumber) return z.union([z.string(), z.number()]);
  return hasNumber ? z.number() : z.string();
}

function optionalEmptyable(schema: z.ZodType): z.ZodType {
  // Optional text-like fields default to "" — treat empty string as absent.
  return z.preprocess((value) => (value === "" ? undefined : value), schema.optional());
}

function applyTextRules(schema: z.ZodString, rules: TextRules | undefined, messages: Messages): z.ZodString {
  let result = schema;
  if (rules?.minLength !== undefined) result = result.min(rules.minLength, messages.minLength(rules.minLength));
  if (rules?.maxLength !== undefined) result = result.max(rules.maxLength, messages.maxLength(rules.maxLength));
  if (rules?.pattern !== undefined) result = result.regex(new RegExp(rules.pattern), rules.message ?? messages.pattern);
  return result;
}

function isoDateSchema(field: Extract<FieldConfig, { type: "date" }>, messages: Messages): z.ZodType {
  let schema = z.string().refine((value) => !Number.isNaN(Date.parse(value)), messages.invalidDate);
  if (field.minDate !== undefined) {
    const minTime = Date.parse(field.minDate);
    schema = schema.refine((value) => Date.parse(value) >= minTime, messages.min(field.minDate));
  }
  if (field.maxDate !== undefined) {
    const maxTime = Date.parse(field.maxDate);
    schema = schema.refine((value) => Date.parse(value) <= maxTime, messages.max(field.maxDate));
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

export function toZodSchema(field: FieldConfig, messages: Messages): FieldSchema {
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
      const schema = applyTextRules(base, field.rules, messages);
      return field.required ? schema : optionalEmptyable(schema);
    }

    case "email": {
      const base = field.required ? z.string({ error: messages.required }).min(1, messages.required) : z.string();
      const schema = applyTextRules(base, field.rules, messages).refine(
        (value) => z.email().safeParse(value).success,
        messages.email,
      );
      return field.required ? schema : optionalEmptyable(schema);
    }

    case "number": {
      let schema = z.number({ error: messages.required });
      if (field.min !== undefined) schema = schema.min(field.min, messages.min(field.min));
      if (field.max !== undefined) schema = schema.max(field.max, messages.max(field.max));
      return field.required ? schema : schema.optional();
    }

    case "otp": {
      const schema = z.string().length(field.length, messages.otpLength(field.length));
      return field.required ? schema : optionalEmptyable(schema);
    }

    case "phone": {
      const schema = z.string();
      return field.required ? schema.min(1, messages.required) : optionalEmptyable(schema);
    }

    case "select": {
      const value = optionValueSchema(field.options);
      if (field.multiple) {
        const schema = z.array(value);
        return field.required ? schema.min(1, messages.required) : schema.optional();
      }
      return field.required ? value : value.optional();
    }

    case "radio": {
      const value = optionValueSchema(field.options);
      return field.required ? value : value.optional();
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
        const schema = z.object({ from: isoDateSchema(field, messages), to: isoDateSchema(field, messages) });
        return field.required ? schema : schema.optional();
      }
      const schema = isoDateSchema(field, messages);
      return field.required ? schema : optionalEmptyable(schema);
    }

    case "slider": {
      let schema = z.number({ error: messages.required });
      schema = schema.min(field.min, messages.min(field.min)).max(field.max, messages.max(field.max));
      return schema;
    }

    case "file": {
      const single = fileSchema(field, messages);
      if (field.multiple) {
        const schema = z.array(single);
        return field.required ? schema.min(1, messages.required) : schema.optional();
      }
      return field.required ? single : single.optional();
    }

    case "group": {
      const row = buildFieldsSchema(field.fields, messages);
      let schema = z.array(row);
      if (field.min !== undefined) schema = schema.min(field.min, messages.min(field.min));
      if (field.max !== undefined) schema = schema.max(field.max, messages.max(field.max));
      return schema;
    }
  }
}

export function buildFieldsSchema(fields: FieldConfig[], messages: Messages): z.ZodObject {
  const shape: Record<string, z.ZodType> = {};
  for (const field of fields) {
    const schema = toZodSchema(field, messages);
    if (schema) shape[field.name] = schema;
  }
  return z.object(shape);
}

export function buildFormSchema(config: FormConfig, messages: Messages): z.ZodObject {
  return buildFieldsSchema(config.fields, messages);
}
