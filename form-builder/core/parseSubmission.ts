import { visibleFieldsFor } from "./conditions";
import { buildDefaultValues } from "./defaults";
import { mergeMessages, type Messages } from "./messages";
import { validateFormConfig } from "./schema";
import type { ServerErrorResult } from "./serverErrors";
import { isBuiltInField } from "./types";
import type { AnyFieldConfig, FormConfig, FormValues } from "./types";
import { buildFieldsSchema, type OtpVerifiedChecker } from "./validation";

export type ParseSubmissionErrorCode =
  | "invalid_body"
  | "otp_checker_missing"
  | "otp_in_group"
  | "input_too_large"
  | "validation_failed";

export type ParseSubmissionOptions = {
  otpVerified?: OtpVerifiedChecker;
  messages?: Partial<Messages>;
  maxStringLength?: number;
};

export type ParseSubmissionResult =
  | { ok: true; values: FormValues; unvalidated: string[] }
  | { ok: false; code: ParseSubmissionErrorCode; errors: ServerErrorResult; unvalidated: string[] };

const DEFAULT_MAX_STRING_LENGTH = 10_000;

export const GENERIC_SUBMISSION_ERROR = "We couldn't process your submission. Please try again.";

const RESERVED_KEYS = ["__proto__", "constructor", "prototype"] as const;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null) return false;
  if (Array.isArray(value)) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function scrubReservedKeys(fields: AnyFieldConfig[], body: Record<string, unknown>): Record<string, unknown> {
  const cleaned: Record<string, unknown> = { ...body };
  for (const key of RESERVED_KEYS) delete cleaned[key];
  for (const field of fields) {
    if (!isBuiltInField(field) || field.type !== "group") continue;
    const rows = cleaned[field.name];
    if (!Array.isArray(rows)) continue;
    const rowFields = Array.isArray(field.fields) ? field.fields : [];
    cleaned[field.name] = rows.map((row) => (isPlainObject(row) ? scrubReservedKeys(rowFields, row) : row));
  }
  return cleaned;
}

function hasGroupOtp(fields: AnyFieldConfig[], insideGroup: boolean): boolean {
  for (const field of fields) {
    if (!isBuiltInField(field)) continue;
    if (field.type === "otp" && insideGroup) return true;
    if (field.type === "group" && hasGroupOtp(field.fields, true)) return true;
  }
  return false;
}

function reinjectHiddenFields(fields: AnyFieldConfig[], body: Record<string, unknown>): Record<string, unknown> {
  const injected: Record<string, unknown> = { ...body };
  for (const field of fields) {
    if (isBuiltInField(field) && field.type === "hidden") {
      injected[field.name] = field.value;
    }
  }
  return injected;
}

function exceedsMaxStringLength(value: unknown, maxLength: number): boolean {
  if (typeof value === "string") return value.length > maxLength;
  if (Array.isArray(value)) return value.some((entry) => exceedsMaxStringLength(entry, maxLength));
  if (isPlainObject(value)) return Object.values(value).some((entry) => exceedsMaxStringLength(entry, maxLength));
  return false;
}

type MinimalIssue = { path: PropertyKey[]; message: string };

function mapIssuesToServerErrors(issues: MinimalIssue[]): ServerErrorResult {
  const fieldErrors: Record<string, string> = {};
  const formParts: string[] = [];
  for (const issue of issues) {
    if (issue.path.length === 0) {
      formParts.push(issue.message);
      continue;
    }
    const key = issue.path.map(String).join(".");
    if (!(key in fieldErrors)) fieldErrors[key] = issue.message;
  }
  const result: ServerErrorResult = {};
  if (Object.keys(fieldErrors).length > 0) result.fieldErrors = fieldErrors;
  if (formParts.length > 0) result.formError = formParts.join("; ");
  return result;
}

export function parseSubmission(
  config: FormConfig,
  rawBody: unknown,
  opts?: ParseSubmissionOptions,
): ParseSubmissionResult {
  if (!isPlainObject(rawBody)) {
    return { ok: false, code: "invalid_body", errors: { formError: GENERIC_SUBMISSION_ERROR }, unvalidated: [] };
  }

  const scrubbed = scrubReservedKeys(config.fields, rawBody);

  validateFormConfig(config);

  const messages = mergeMessages(opts?.messages);

  if (hasGroupOtp(config.fields, false)) {
    return { ok: false, code: "otp_in_group", errors: { formError: GENERIC_SUBMISSION_ERROR }, unvalidated: [] };
  }

  const defaults = buildDefaultValues(config.fields);
  const seeded: Record<string, unknown> = { ...defaults };
  for (const [key, value] of Object.entries(scrubbed)) {
    if (value === undefined && key in defaults) continue;
    seeded[key] = value;
  }
  const injected = reinjectHiddenFields(config.fields, seeded);

  const maxStringLength = opts?.maxStringLength ?? DEFAULT_MAX_STRING_LENGTH;
  if (exceedsMaxStringLength(scrubbed, maxStringLength)) {
    return { ok: false, code: "input_too_large", errors: { formError: GENERIC_SUBMISSION_ERROR }, unvalidated: [] };
  }

  const visibleFields = visibleFieldsFor(config, injected as FormValues);

  const schemaFields: AnyFieldConfig[] = [];
  const unvalidated: string[] = [];
  for (const field of visibleFields) {
    const isFile = isBuiltInField(field) && field.type === "file";
    if (isFile || !isBuiltInField(field)) unvalidated.push(field.name);
    if (!isFile) schemaFields.push(field);
  }

  const otpFieldNames = schemaFields
    .filter((field) => isBuiltInField(field) && field.type === "otp")
    .map((field) => field.name);
  if (otpFieldNames.length > 0 && opts?.otpVerified === undefined) {
    const fieldErrors: Record<string, string> = {};
    for (const name of otpFieldNames) fieldErrors[name] = messages.otpNotVerified;
    return {
      ok: false,
      code: "otp_checker_missing",
      errors: { fieldErrors, formError: GENERIC_SUBMISSION_ERROR },
      unvalidated,
    };
  }

  const schema = buildFieldsSchema(schemaFields, messages, opts?.otpVerified);
  const parsed = schema.safeParse(injected);

  if (!parsed.success) {
    return {
      ok: false,
      code: "validation_failed",
      errors: mapIssuesToServerErrors(parsed.error.issues),
      unvalidated,
    };
  }

  const values = { ...parsed.data } as FormValues;
  for (const field of config.fields) {
    if (isBuiltInField(field) && field.type === "hidden" && field.name in values) {
      values[field.name] = field.value;
    }
  }

  for (const field of visibleFields) {
    if (isBuiltInField(field) && field.type === "file" && field.name in scrubbed) {
      values[field.name] = injected[field.name];
    }
  }

  return { ok: true, values, unvalidated };
}
