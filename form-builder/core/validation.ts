import { z } from "zod";
import { getCountries, isValidPhoneNumber } from "libphonenumber-js";
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

    case "masked": {
      // Completeness = raw length equals the mask's token count; the raw value
      // itself is char-class-filtered at input time by the component.
      const tokenCount = [...field.mask].filter((char) => char === "#" || char === "A" || char === "*").length;
      const base = field.required ? z.string({ error: messages.required }).min(1, messages.required) : z.string();
      const schema = base.refine(
        (value) => (value as string).length === tokenCount,
        field.message ?? messages.maskIncomplete,
      );
      return field.required ? schema : optionalEmptyable(schema);
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
      // optionsFrom: the field schema validates against the union of ALL
      // branches (shape + required); membership in the CURRENT source
      // branch needs the sibling's value, so it lives in the form-level
      // refine (same layer as cross-field rules — isValid oracle constraint).
      const options = field.optionsFrom ? Object.values(field.optionsFrom.map).flat() : (field.options ?? []);
      if (field.multiple) {
        const schema = z.array(optionValueSchema(options));
        return field.required ? schema.min(1, messages.required) : schema.optional();
      }
      const value = optionValueSchema(options, field.required ? messages.required : undefined);
      return field.required ? value : optionalClearable(value);
    }

    case "country": {
      const allowed = new Set<string>(field.countries ?? (getCountries() as string[]));
      const base = field.required ? z.string({ error: messages.required }).min(1, messages.required) : z.string();
      const schema = base.refine((value) => allowed.has(value as string), messages.invalidCountry);
      return field.required ? schema : optionalClearable(schema);
    }

    case "radio":
    case "segmented": {
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

    case "rating": {
      const max = field.max ?? 5;
      const schema = z
        .number({ error: messages.required })
        .int(messages.required)
        .min(1, messages.min(1))
        .max(max, messages.max(max));
      return field.required ? schema : optionalClearable(schema);
    }

    case "slider": {
      // Always required: the slider always has a value (defaults to min).
      let schema = z.number({ error: messages.required });
      schema = schema.min(field.min, messages.min(field.min)).max(field.max, messages.max(field.max));
      return schema;
    }

    case "signature": {
      // The component only ever writes "" or a canvas data URL; the prefix
      // check guards CMS/programmatic values. Empty = not signed = required.
      const base = field.required ? z.string({ error: messages.required }).min(1, messages.required) : z.string();
      const schema = base.refine((value) => (value as string).startsWith("data:image/"), messages.required);
      return field.required ? schema : optionalEmptyable(schema);
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

type CrossRuleKind = "matches" | "minDate" | "maxDate" | "minTime" | "maxTime";

export type CrossRulePair = {
  field: string; // declaring field — the refine issue lands here
  source: string;
  kind: CrossRuleKind;
  matchesMessage?: string;
};

type CrossRule = CrossRulePair & { message: string };

const TEXT_FAMILY = new Set(["text", "email", "password", "textarea"]);
const DATE_FORMAT = /^\d{4}-\d{2}-\d{2}(T|$)/;
const TIME_FORMAT = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Every declared cross-field rule, regardless of source visibility. */
export function collectCrossRulePairs(fields: AnyFieldConfig[]): CrossRulePair[] {
  const pairs: CrossRulePair[] = [];
  for (const field of fields) {
    if (!isBuiltInField(field)) continue;
    if (TEXT_FAMILY.has(field.type)) {
      const rules = (field as { rules?: TextRules }).rules;
      if (rules?.matches !== undefined) {
        pairs.push({ field: field.name, source: rules.matches, kind: "matches", matchesMessage: rules.matchesMessage });
      }
    }
    if (field.type === "date" && !field.range) {
      if (field.minDateField !== undefined) pairs.push({ field: field.name, source: field.minDateField, kind: "minDate" });
      if (field.maxDateField !== undefined) pairs.push({ field: field.name, source: field.maxDateField, kind: "maxDate" });
    }
    if (field.type === "time") {
      if (field.minTimeField !== undefined) pairs.push({ field: field.name, source: field.minTimeField, kind: "minTime" });
      if (field.maxTimeField !== undefined) pairs.push({ field: field.name, source: field.maxTimeField, kind: "maxTime" });
    }
  }
  return pairs;
}

/**
 * Cross-field rules resolved against the SAME field list — a rule whose
 * source is not in the list (condition-hidden in the resolver path) is
 * dropped: its value is stripped, and comparing against undefined would
 * raise an unfixable error.
 */
function collectCrossRules(fields: AnyFieldConfig[], messages: Messages): CrossRule[] {
  const byName = new Map(fields.map((field) => [field.name, field]));
  const label = (name: string) => byName.get(name)?.label || name;
  const messageFor = (pair: CrossRulePair): string => {
    switch (pair.kind) {
      case "matches":
        return pair.matchesMessage ?? messages.matches(label(pair.source));
      case "minDate":
        return messages.dateAfter(label(pair.source));
      case "maxDate":
        return messages.dateBefore(label(pair.source));
      case "minTime":
        return messages.timeAfter(label(pair.source));
      case "maxTime":
        return messages.timeBefore(label(pair.source));
    }
  };
  return collectCrossRulePairs(fields)
    .filter((pair) => byName.has(pair.source))
    .map((pair) => ({ ...pair, message: messageFor(pair) }));
}

function crossRulePasses(rule: CrossRule, target: unknown, source: unknown): boolean {
  if (rule.kind === "matches") return target === source;
  if (typeof target !== "string" || typeof source !== "string") return true;
  switch (rule.kind) {
    // Skip when either side fails the basic format — the field's own schema
    // reports that; a garbage lexicographic compare would stack a bogus error.
    case "minDate":
      return !DATE_FORMAT.test(target) || !DATE_FORMAT.test(source) || datePart(target) >= datePart(source);
    case "maxDate":
      return !DATE_FORMAT.test(target) || !DATE_FORMAT.test(source) || datePart(target) <= datePart(source);
    case "minTime":
      return !TIME_FORMAT.test(target) || !TIME_FORMAT.test(source) || target >= source;
    case "maxTime":
      return !TIME_FORMAT.test(target) || !TIME_FORMAT.test(source) || target <= source;
  }
}

function isBlank(value: unknown): boolean {
  return value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0);
}

type OptionsFromRule = {
  field: string;
  source: string;
  map: Record<string, Option[]>;
  multiple: boolean;
};

/**
 * optionsFrom branch-membership rules — like cross rules, resolved against
 * the SAME field list so a condition-hidden source drops the rule.
 */
function collectOptionsFromRules(fields: AnyFieldConfig[]): OptionsFromRule[] {
  const names = new Set(fields.map((field) => field.name));
  const rules: OptionsFromRule[] = [];
  for (const field of fields) {
    if (!isBuiltInField(field) || field.type !== "select" || !field.optionsFrom) continue;
    if (!names.has(field.optionsFrom.field)) continue;
    rules.push({
      field: field.name,
      source: field.optionsFrom.field,
      map: field.optionsFrom.map,
      multiple: field.multiple === true,
    });
  }
  return rules;
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
  const objectSchema = z.object(shape);

  // Cross-field rules live at the form level, never inside a field's own
  // schema — the isValid condition oracle safeParses field schemas in
  // isolation and must stay ignorant of siblings.
  const crossRules = collectCrossRules(fields, messages);
  const optionsFromRules = collectOptionsFromRules(fields);
  if (crossRules.length === 0 && optionsFromRules.length === 0) return objectSchema;
  return objectSchema.superRefine((values, ctx) => {
    for (const rule of crossRules) {
      const target = (values as Record<string, unknown>)[rule.field];
      const source = (values as Record<string, unknown>)[rule.source];
      // Blank target: `required` owns emptiness — no double error. Blank
      // source: nothing to compare against yet.
      if (isBlank(target) || isBlank(source)) continue;
      if (!crossRulePasses(rule, target, source)) {
        ctx.addIssue({ code: "custom", path: [rule.field], message: rule.message });
      }
    }
    for (const rule of optionsFromRules) {
      const target = (values as Record<string, unknown>)[rule.field];
      if (isBlank(target)) continue;
      const sourceValue = (values as Record<string, unknown>)[rule.source];
      // Blank source explicitly allows NOTHING (a stale pre-filled value must
      // not submit) — and never aliases into a branch literally keyed
      // "undefined" via String().
      const allowed = isBlank(sourceValue)
        ? new Set<Option["value"]>()
        : new Set((rule.map[String(sourceValue)] ?? []).map((option) => option.value));
      const passes = rule.multiple
        ? Array.isArray(target) && target.every((entry) => allowed.has(entry as Option["value"]))
        : allowed.has(target as Option["value"]);
      if (!passes) {
        ctx.addIssue({ code: "custom", path: [rule.field], message: messages.invalidOption });
      }
    }
  });
}

export function buildFormSchema(config: FormConfig, messages: Messages, otpVerified?: OtpVerifiedChecker): z.ZodObject {
  return buildFieldsSchema(config.fields, messages, otpVerified);
}
