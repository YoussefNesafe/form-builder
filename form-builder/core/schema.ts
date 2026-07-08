import { z } from "zod";
import { getCountries } from "libphonenumber-js";
import { getRegisteredTypes } from "./registry";
import type { FieldConfig, FormConfig } from "./types";

const countryCodeSchema = z.string().refine(
  (code) => (getCountries() as string[]).includes(code),
  { message: "not a valid ISO 3166-1 alpha-2 country code (e.g. \"AE\")" },
);

const conditionSchema = z
  .strictObject({
    field: z.string().min(1),
    equals: z.unknown().optional(),
    notEquals: z.unknown().optional(),
    in: z.array(z.unknown()).optional(),
  })
  .refine((cond) => "equals" in cond || "notEquals" in cond || "in" in cond, {
    message: "condition needs at least one operator (equals, notEquals, in)",
  });

const optionSchema = z.strictObject({
  label: z.string(),
  value: z.union([z.string(), z.number()]),
  disabled: z.boolean().optional(),
});

const fieldWidthValueSchema = z.enum(["full", "half", "third", "quarter"]);

const fieldWidthSchema = z.union([
  fieldWidthValueSchema,
  z.strictObject({
    mobile: fieldWidthValueSchema.optional(),
    tablet: fieldWidthValueSchema.optional(),
    desktop: fieldWidthValueSchema.optional(),
  }),
]);

const baseFieldSchema = z.strictObject({
  type: z.string(),
  // Dots would be read as nested paths by RHF and the condition engine.
  name: z
    .string()
    .min(1)
    .refine((name) => !name.includes("."), { message: "field names must not contain dots" }),
  label: z.string().optional(),
  description: z.string().optional(),
  placeholder: z.string().optional(),
  required: z.boolean().optional(),
  disabled: z.boolean().optional(),
  visibleWhen: conditionSchema.optional(),
  disabledWhen: conditionSchema.optional(),
  enabledWhenVerified: z.string().min(1).optional(),
  width: fieldWidthSchema.optional(),
});

// Quantified group itself quantified — the classic catastrophic-backtracking
// shape ((a+)+, (a*)+, (a{2,})*). Heuristic, not a proof: configs are expected
// to come from trusted authors; this catches the common footgun.
const NESTED_QUANTIFIER = /\([^)]*[+*}][^)]*\)[+*{]/;

// The allow body is interpolated into [^...] — restrict it to plain
// characters, ranges, and a short escape whitelist so a crafted body cannot
// close the class or change its semantics.
function isSafeCharClassBody(body: string): boolean {
  if (body.startsWith("^")) return false;
  for (let i = 0; i < body.length; i += 1) {
    const char = body[i];
    if (char === "[" || char === "]") return false;
    if (char === "\\") {
      const next = body[i + 1];
      if (next === undefined || !/[dwsDWS\\\-.,'"]/.test(next)) return false;
      i += 1;
    }
  }
  try {
    new RegExp(`[^${body}]`, "g");
    return true;
  } catch {
    return false;
  }
}

const textRulesSchema = z.strictObject({
  minLength: z.number().int().nonnegative().optional(),
  maxLength: z.number().int().nonnegative().optional(),
  pattern: z
    .string()
    .max(256, "pattern is too long (max 256 chars)")
    .optional()
    .refine(
      (pattern) => {
        if (pattern === undefined) return true;
        try {
          new RegExp(pattern);
          return true;
        } catch {
          return false;
        }
      },
      { message: "pattern is not a valid regular expression" },
    )
    .refine((pattern) => pattern === undefined || !NESTED_QUANTIFIER.test(pattern), {
      message: "pattern contains a nested quantifier (ReDoS risk)",
    }),
  message: z.string().optional(),
  trim: z.boolean().optional(),
  allow: z
    .string()
    .min(1)
    .optional()
    .refine((allow) => allow === undefined || isSafeCharClassBody(allow), {
      message: "allow must be a plain character-class body (letters, digits, ranges, \\d \\w \\s escapes)",
    }),
});

const textFieldSchema = baseFieldSchema.extend({ rules: textRulesSchema.optional() });

// Group fields are validated shallowly here; validateFields recurses per level.
const fieldSchemasByType: Record<FieldConfig["type"], z.ZodType> = {
  text: textFieldSchema,
  email: textFieldSchema,
  password: textFieldSchema.extend({
    complexity: z
      .strictObject({
        uppercase: z.boolean().optional(),
        lowercase: z.boolean().optional(),
        number: z.boolean().optional(),
        special: z.boolean().optional(),
        minLength: z.number().int().positive().optional(),
      })
      .optional(),
  }),
  textarea: textFieldSchema,
  number: baseFieldSchema.extend({
    min: z.number().optional(),
    max: z.number().optional(),
    step: z.number().optional(),
  }),
  otp: baseFieldSchema.extend({
    length: z.number().int().positive(),
    dependsOn: z.string().min(1).optional(),
  }),
  phone: baseFieldSchema.extend({
    defaultCountry: countryCodeSchema.optional(),
    preferredCountries: z.array(countryCodeSchema).optional(),
    countryFrom: z.string().min(1).optional(),
  }),
  select: baseFieldSchema.extend({
    options: z.array(optionSchema).min(1),
    searchable: z.boolean().optional(),
    multiple: z.boolean().optional(),
  }),
  radio: baseFieldSchema.extend({ options: z.array(optionSchema).min(1) }),
  checkbox: baseFieldSchema.extend({ options: z.array(optionSchema).optional() }),
  switch: baseFieldSchema.extend({ options: z.array(optionSchema).optional() }),
  date: baseFieldSchema.extend({
    range: z.boolean().optional(),
    // Strict yyyy-MM-dd: lexicographic boundary compare and the calendar
    // matchers both require zero-padded date-only strings.
    minDate: z.iso.date().optional(),
    maxDate: z.iso.date().optional(),
  }),
  slider: baseFieldSchema.extend({
    min: z.number(),
    max: z.number(),
    step: z.number().optional(),
  }),
  file: baseFieldSchema.extend({
    accept: z.string().optional(),
    maxSizeMB: z.number().positive().optional(),
    multiple: z.boolean().optional(),
  }),
  hidden: baseFieldSchema.extend({ value: z.unknown() }),
  static: baseFieldSchema.extend({
    content: z.string(),
    as: z.enum(["h1", "h2", "p", "divider"]).optional(),
  }),
  group: baseFieldSchema.extend({
    fields: z.array(z.record(z.string(), z.unknown())).min(1),
    min: z.number().int().nonnegative().optional(),
    max: z.number().int().positive().optional(),
  }),
  submit: baseFieldSchema.extend({
    text: z.string().min(1),
    variant: z.enum(["default", "destructive", "outline", "secondary", "ghost", "link"]).optional(),
  }),
};

const customFieldSchema = z.looseObject(baseFieldSchema.shape);

const formConfigShellSchema = z.object({
  id: z.string().min(1),
  title: z.string().optional(),
  description: z.string().optional(),
  fields: z.array(z.record(z.string(), z.unknown())).min(1),
  steps: z.array(z.object({ title: z.string(), fieldNames: z.array(z.string()).min(1) })).optional(),
});

function formatIssues(issues: z.core.$ZodIssue[], path: string): string {
  return issues.map((issue) => `${path}${issue.path.length ? "." + issue.path.join(".") : ""}: ${issue.message}`).join("; ");
}

function validateFields(fields: unknown[], path: string, insideGroup = false): void {
  const seenNames = new Set<string>();

  fields.forEach((raw, index) => {
    const fieldPath = `${path}[${index}]`;
    const type = (raw as { type?: unknown })?.type;
    const isBuiltIn = typeof type === "string" && type in fieldSchemasByType;

    if (!isBuiltIn && (typeof type !== "string" || !getRegisteredTypes().includes(type))) {
      throw new Error(`Invalid form config at ${fieldPath}: unknown field type "${String(type)}"`);
    }

    // Group rows get runtime-prefixed names; verification wiring (registry
    // keys, dependsOn watches) cannot resolve there — reject instead of
    // silently misbehaving.
    if (insideGroup) {
      const wiring = raw as { dependsOn?: unknown; enabledWhenVerified?: unknown };
      if (type === "otp" && wiring.dependsOn !== undefined) {
        throw new Error(`Invalid form config at ${fieldPath}: otp dependsOn is not supported inside groups`);
      }
      if (wiring.enabledWhenVerified !== undefined) {
        throw new Error(
          `Invalid form config at ${fieldPath}: enabledWhenVerified is not supported inside groups`,
        );
      }
    }

    // Custom registered types: validate the BaseField contract only — their
    // extra props belong to the consuming component.
    const schema = isBuiltIn ? fieldSchemasByType[type as FieldConfig["type"]] : customFieldSchema;
    if (!isBuiltIn && (raw as { required?: unknown }).required === true && process.env.NODE_ENV !== "production") {
      console.warn(
        `form-builder: custom field "${(raw as { name?: unknown }).name}" sets required, but custom field values pass validation as unknown — enforce it in the component or onSubmit`,
      );
    }
    const result = schema.safeParse(raw);
    if (!result.success) {
      throw new Error(`Invalid form config at ${formatIssues(result.error.issues, fieldPath)}`);
    }

    if (type === "hidden" && !("value" in (raw as object))) {
      throw new Error(`Invalid form config at ${fieldPath}: hidden field requires a value`);
    }

    const name = (raw as { name: string }).name;
    if (seenNames.has(name)) {
      throw new Error(`Invalid form config at ${fieldPath}: duplicate field name "${name}"`);
    }
    seenNames.add(name);

    if (type === "group") {
      validateFields((raw as { fields: unknown[] }).fields, `${fieldPath}.fields`, true);
    }
  });

  // Same-level checks only: group rows get runtime-prefixed names, so
  // cross-level references could never resolve anyway.
  const typeByName = new Map(
    fields.map((raw) => [(raw as { name: string }).name, (raw as { type?: unknown }).type]),
  );
  fields.forEach((raw, index) => {
    const field = raw as { type?: unknown; name: string; dependsOn?: unknown; enabledWhenVerified?: unknown };

    if (field.type === "otp" && field.dependsOn !== undefined) {
      if (!seenNames.has(field.dependsOn as string) || field.dependsOn === field.name) {
        throw new Error(
          `Invalid form config at ${path}[${index}]: otp dependsOn references unknown field "${String(field.dependsOn)}"`,
        );
      }
    }

    if (field.enabledWhenVerified !== undefined) {
      const target = field.enabledWhenVerified as string;
      if (typeByName.get(target) !== "otp" || target === field.name) {
        throw new Error(
          `Invalid form config at ${path}[${index}]: enabledWhenVerified must reference a sibling otp field, got "${target}"`,
        );
      }
    }
  });
}

function validateSteps(config: FormConfig): void {
  if (!config.steps) return;

  const topLevelNames = new Set(config.fields.map((field) => field.name));
  const stepped = new Set<string>();
  for (const step of config.steps) {
    for (const fieldName of step.fieldNames) {
      if (!topLevelNames.has(fieldName)) {
        throw new Error(`Invalid form config: step "${step.title}" references unknown field "${fieldName}"`);
      }
      stepped.add(fieldName);
    }
  }

  // An otp field on a different step than its dependsOn source can be edited
  // while the otp field is unmounted; the stale-snapshot reconcile only runs
  // on remount, so keep the pair on one step unless that is understood.
  if (process.env.NODE_ENV !== "production") {
    const stepOf = new Map<string, number>();
    config.steps.forEach((step, index) => step.fieldNames.forEach((name) => stepOf.set(name, index)));
    for (const field of config.fields) {
      const dependsOn = field.type === "otp" ? (field as { dependsOn?: string }).dependsOn : undefined;
      if (dependsOn === undefined) continue;
      const otpStep = stepOf.get(field.name);
      const depStep = stepOf.get(dependsOn);
      if (otpStep !== undefined && depStep !== undefined && otpStep !== depStep) {
        console.warn(
          `form-builder: otp field "${field.name}" (step ${otpStep + 1}) depends on "${dependsOn}" (step ${depStep + 1}) — editing the source while the otp field is unmounted defers re-verification until the otp step remounts`,
        );
      }
    }
  }

  // A validated field missing from every step can never be corrected by the
  // user — the form becomes permanently unsubmittable with invisible errors.
  for (const field of config.fields) {
    const exemptFromSteps = field.type === "hidden" || field.type === "submit";
    if (!exemptFromSteps && !stepped.has(field.name)) {
      throw new Error(`Invalid form config: field "${field.name}" is not assigned to any step`);
    }
    if (exemptFromSteps && stepped.has(field.name)) {
      throw new Error(
        `Invalid form config: ${field.type} field "${field.name}" must not be listed in steps (rendered automatically)`,
      );
    }
  }
}

// Runs in production too: configs may arrive from a CMS at runtime, and an
// unvalidated pattern/allow string reaching new RegExp() inside the resolver
// would brick the whole form. One-time cost per config (memoized by callers).
export function validateFormConfig(config: FormConfig): void {
  const shell = formConfigShellSchema.safeParse(config);
  if (!shell.success) {
    throw new Error(`Invalid form config at ${formatIssues(shell.error.issues, config?.id ?? "config")}`);
  }

  validateFields(config.fields, "fields");
  validateSteps(config);
}
