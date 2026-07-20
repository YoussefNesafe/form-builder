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

// Hidden field values live on the (module-level, process-lifetime) FormConfig
// object. Assigning field.value directly aliases that object by reference
// into the result: two rows (or two separate requests sharing the same
// config) end up pointing at the SAME object, and a host mutating a returned
// row's hidden value would silently mutate the config for every subsequent
// submission in the process. structuredClone breaks that aliasing. Hidden
// values are JSON-ish by contract (BaseField & { value: unknown }), but
// "unknown" technically permits something non-cloneable (a function, a
// symbol) if a host misconfigures it — a config value must never crash the
// submission path, so we fall back to the original reference rather than
// throw. That fallback re-introduces the aliasing risk only for that
// pathological, contract-violating value.
function cloneHiddenValue(value: unknown): unknown {
  try {
    return structuredClone(value);
  } catch {
    return value;
  }
}

function reinjectHiddenFields(fields: AnyFieldConfig[], body: Record<string, unknown>): Record<string, unknown> {
  const injected: Record<string, unknown> = { ...body };
  for (const field of fields) {
    if (!isBuiltInField(field)) continue;
    if (field.type === "hidden") {
      injected[field.name] = cloneHiddenValue(field.value);
      continue;
    }
    if (field.type !== "group") continue;
    const rows = injected[field.name];
    if (!Array.isArray(rows)) continue;
    const rowFields = Array.isArray(field.fields) ? field.fields : [];
    injected[field.name] = rows.map((row) => (isPlainObject(row) ? reinjectHiddenFields(rowFields, row) : row));
  }
  return injected;
}

function reassertHiddenFields(fields: AnyFieldConfig[], values: Record<string, unknown>): Record<string, unknown> {
  const asserted: Record<string, unknown> = { ...values };
  for (const field of fields) {
    if (!isBuiltInField(field)) continue;
    if (field.type === "hidden") {
      if (field.name in asserted) asserted[field.name] = cloneHiddenValue(field.value);
      continue;
    }
    if (field.type !== "group") continue;
    const rows = asserted[field.name];
    if (!Array.isArray(rows)) continue;
    const rowFields = Array.isArray(field.fields) ? field.fields : [];
    asserted[field.name] = rows.map((row) => (isPlainObject(row) ? reassertHiddenFields(rowFields, row) : row));
  }
  return asserted;
}

// Depth is counted per recursive call over the BODY's structure — each
// nested array/object encountered while walking the submitted value adds 1 —
// NOT per level of config (group) nesting; a form with two levels of nested
// groups is nowhere near this cap. Past the cap we return true (reject)
// rather than keep searching: continuing to recurse is exactly the unbounded
// recursion this cap exists to prevent, so "found a violation" is the only
// safe answer once we can no longer afford to look further. This reuses
// "input_too_large" deliberately rather than a distinct code — the code is
// never echoed back to the submitter (see ADR-0004's generic formError), and
// a body nested 33+ levels deep is abusive by definition regardless of
// whether a string happened to be too long too.
const MAX_STRING_LENGTH_CHECK_DEPTH = 32;

function exceedsMaxStringLength(value: unknown, maxLength: number, depth = 0): boolean {
  if (depth > MAX_STRING_LENGTH_CHECK_DEPTH) return true;
  if (typeof value === "string") return value.length > maxLength;
  if (Array.isArray(value)) return value.some((entry) => exceedsMaxStringLength(entry, maxLength, depth + 1));
  if (isPlainObject(value)) {
    return Object.values(value).some((entry) => exceedsMaxStringLength(entry, maxLength, depth + 1));
  }
  return false;
}

// Same top-level-only iteration bug class as reinjectHiddenFields/
// reassertHiddenFields above: file and custom-registered fields must be
// excluded from the SCHEMA at every group depth, not just the top level, or
// a JSON body can never satisfy a nested `z.instanceof(File)` row schema.
// `prefix` accumulates the dotted, index-less group path ("items",
// "outer.inner", ...) so `unvalidated` reports a config-derived key that
// does NOT vary with how many rows were actually submitted. Group fields are
// re-pushed as a shallow clone with a pruned `.fields` list (files dropped,
// custom types kept — they validate as z.unknown().optional() and only need
// reporting) so buildFieldsSchema's `case "group"` builds a row schema with
// no nested file instanceof check, while every other group property (min,
// max, name) passes through unchanged.
function partitionValidatable(
  fields: AnyFieldConfig[],
  prefix: string,
): { schemaFields: AnyFieldConfig[]; unvalidated: string[] } {
  const schemaFields: AnyFieldConfig[] = [];
  const unvalidated: string[] = [];
  for (const field of fields) {
    const path = prefix ? `${prefix}.${field.name}` : field.name;
    const isFile = isBuiltInField(field) && field.type === "file";
    if (isFile || !isBuiltInField(field)) unvalidated.push(path);
    if (isFile) continue;
    if (isBuiltInField(field) && field.type === "group") {
      // Guard `field.fields` like every sibling walker (scrubReservedKeys,
      // reinjectHiddenFields, reassertHiddenFields, reinjectNestedFileValues)
      // rather than lean on validateFormConfig having run first — keeps this
      // walker locally safe if it's ever reused before validation.
      const rowFields = Array.isArray(field.fields) ? field.fields : [];
      const nested = partitionValidatable(rowFields, path);
      unvalidated.push(...nested.unvalidated);
      schemaFields.push({ ...field, fields: nested.schemaFields });
      continue;
    }
    schemaFields.push(field);
  }
  return { schemaFields, unvalidated };
}

// Mirrors the top-level file pass-through below (`field.name in scrubbed`),
// but recurses into group rows by INDEX, pairing each `values` row with its
// RAW `scrubbed` row — never `injected`. buildDefaultValues seeds a group's
// default rows with `file: undefined`, and `injected` carries those
// seeded/hidden-merged rows; checking `injected` would synthesize a
// `receipt: undefined` key the client never sent. `scrubbed` is the raw body
// (reserved keys stripped, recursively) and is the correct "did the client
// send it" oracle. Only recurses where both the parsed row and the raw row
// are plain objects and both arrays exist; indices align because a
// successful zod array parse preserves order and count.
function reinjectNestedFileValues(
  fields: AnyFieldConfig[],
  values: Record<string, unknown>,
  scrubbed: Record<string, unknown>,
): void {
  for (const field of fields) {
    if (!isBuiltInField(field) || field.type !== "group") continue;
    const valueRows = values[field.name];
    const scrubbedRows = scrubbed[field.name];
    if (!Array.isArray(valueRows) || !Array.isArray(scrubbedRows)) continue;
    const rowFields = Array.isArray(field.fields) ? field.fields : [];
    for (let i = 0; i < valueRows.length; i++) {
      const valueRow = valueRows[i];
      const scrubbedRow = scrubbedRows[i];
      if (!isPlainObject(valueRow) || !isPlainObject(scrubbedRow)) continue;
      for (const rowField of rowFields) {
        if (isBuiltInField(rowField) && rowField.type === "file" && rowField.name in scrubbedRow) {
          valueRow[rowField.name] = scrubbedRow[rowField.name];
        }
      }
      reinjectNestedFileValues(rowFields, valueRow, scrubbedRow);
    }
  }
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

  // Deliberately checks `scrubbed`, not `injected`: `scrubbed` is exactly the
  // attacker-controlled surface (the request body, minus reserved-key
  // pollution), while `injected` also carries hidden field values pulled
  // from the config. Checking `injected` would mean a config with a
  // legitimately large hidden value (a serialized token, a base64 blob)
  // fails EVERY submission to that form with input_too_large — a bug the
  // submitter can never fix, since the oversized value isn't theirs. Both
  // the code-reviewer and security-engineer independently confirmed this is
  // correct as written — do not "align" it to `injected`.
  const maxStringLength = opts?.maxStringLength ?? DEFAULT_MAX_STRING_LENGTH;
  if (exceedsMaxStringLength(scrubbed, maxStringLength)) {
    return { ok: false, code: "input_too_large", errors: { formError: GENERIC_SUBMISSION_ERROR }, unvalidated: [] };
  }

  const visibleFields = visibleFieldsFor(config, injected as FormValues);

  const { schemaFields, unvalidated } = partitionValidatable(visibleFields, "");

  // Top-level only ON PURPOSE, and only safe because of it: a group-nested otp
  // is rejected upstream (hasGroupOtp -> otp_in_group above, plus the config
  // validator rejects group-nested otp wiring), so an otp can never reach this
  // filter from inside a group. If group-nested otp is ever permitted, this
  // derivation MUST recurse too or nested otp fields silently skip the
  // verified-code submit gate.
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

  const values = reassertHiddenFields(config.fields, parsed.data as Record<string, unknown>) as FormValues;

  for (const field of visibleFields) {
    if (isBuiltInField(field) && field.type === "file" && field.name in scrubbed) {
      values[field.name] = injected[field.name];
    }
  }
  reinjectNestedFileValues(visibleFields, values, scrubbed);

  return { ok: true, values, unvalidated };
}
