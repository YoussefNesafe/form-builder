import type { FieldType } from "@/form-builder";

/**
 * Initial props applied when a field is added, so a freshly-dropped field
 * serializes to a (nearly) valid config — required keys per type are present.
 * `name` is assigned by the store (kept unique); labels are left for the user.
 */
export const DEFAULT_PROPS: Record<FieldType, Record<string, unknown>> = {
  text: {},
  email: {},
  textarea: {},
  password: {},
  masked: { mask: "####" },
  number: {},
  otp: { length: 6 },
  phone: {},
  select: { options: [{ label: "Option 1", value: "option-1" }] },
  country: {},
  radio: { options: [{ label: "Option 1", value: "option-1" }] },
  segmented: { options: [{ label: "Option 1", value: "option-1" }] },
  checkbox: {},
  switch: {},
  date: {},
  time: {},
  rating: {},
  slider: { min: 0, max: 100 },
  signature: {},
  file: {},
  hidden: { value: "" },
  static: { content: "Text", as: "p" },
  submit: { text: "Submit" },
  group: {},
};

/** Types that nest child fields. */
export const CONTAINER_TYPES: FieldType[] = ["group"];

/**
 * Step-eligible field types: hidden/submit render automatically outside the
 * stepper and must never be assignable to (or auto-seeded into) a step.
 */
export function isStepEligible(type: FieldType): boolean {
  return type !== "hidden" && type !== "submit";
}
