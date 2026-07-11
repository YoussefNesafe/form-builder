import type { Messages } from "../core/messages";
import { isBuiltInField, type AnyFieldConfig, type FieldConfig, type Option } from "../core/types";
import { formatMasked } from "../fields/maskedValue";
import type { FormLocale } from "./FieldRuntime";

export type ReviewFormatter = (value: unknown, field: AnyFieldConfig) => string;
export type ReviewFormatters = Record<string, ReviewFormatter>;

export type ReviewValueContext = {
  messages: Messages;
  locale?: FormLocale;
  verifiedFields?: ReadonlySet<string>;
  reviewFormatters?: ReviewFormatters;
};

const isBlank = (value: unknown): boolean =>
  value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0);

function optionPool(field: Extract<FieldConfig, { type: "select" }>): Option[] {
  return field.optionsFrom ? Object.values(field.optionsFrom.map).flat() : (field.options ?? []);
}

function optionLabels(options: Option[], value: unknown): string {
  const values = Array.isArray(value) ? value : [value];
  return values
    .map((entry) => options.find((option) => option.value === entry)?.label ?? String(entry))
    .join(", ");
}

function countryLabel(code: string, locale?: FormLocale): string {
  // Same chain as CountryField: host labels → Intl.DisplayNames → code.
  try {
    return locale?.countryLabels?.[code] ?? new Intl.DisplayNames(undefined, { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
}

/**
 * Human-readable review-step display for a field's current value. Returns a
 * STRING (signatures are handled by the component — they render as an image,
 * not text). Group values are handled by the component too (nested rows).
 */
export function formatReviewValue(field: AnyFieldConfig, value: unknown, ctx: ReviewValueContext): string {
  const { messages } = ctx;
  if (!isBuiltInField(field)) {
    const custom = ctx.reviewFormatters?.[field.type];
    if (custom) return custom(value, field);
    return isBlank(value) ? messages.notAnswered : String(value);
  }
  // otp first: the code itself is a credential — show verification state.
  // Three states: verified / typed-but-unverified / blank ("not answered"
  // for a typed code would misdescribe the actionable state).
  if (field.type === "otp") {
    if (ctx.verifiedFields?.has(field.name)) return messages.otpVerified;
    return isBlank(value) ? messages.notAnswered : messages.otpNotVerified;
  }
  if (field.type === "password") return isBlank(value) ? messages.notAnswered : "••••••";
  // A signature value is a base64 data URL — never return it as TEXT (a
  // group-nested signature or a direct host call would dump thousands of
  // characters). The component renders top-level signatures as an image.
  if (field.type === "signature") return isBlank(value) ? messages.notAnswered : messages.signed;
  if (isBlank(value)) return messages.notAnswered;

  switch (field.type) {
    case "select":
      return optionLabels(optionPool(field), value);
    case "radio":
    case "segmented":
      return optionLabels(field.options, value);
    case "checkbox":
      if (field.options?.length) return optionLabels(field.options, value);
      return value === true ? messages.yes : messages.no;
    case "switch":
      return value === true ? messages.yes : messages.no;
    case "country":
      return countryLabel(String(value), ctx.locale);
    case "masked":
      return formatMasked(String(value), field.mask);
    case "date": {
      if (field.range && typeof value === "object" && value !== null) {
        const range = value as { from?: string; to?: string };
        return [range.from, range.to].filter(Boolean).join(" – ") || messages.notAnswered;
      }
      return String(value);
    }
    case "file": {
      const files = Array.isArray(value) ? value : [value];
      return files
        .map((file) => (typeof File !== "undefined" && file instanceof File ? file.name : String(file)))
        .join(", ");
    }
    default:
      return String(value);
  }
}
