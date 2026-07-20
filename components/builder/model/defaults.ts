import type { FieldType } from "@/form-builder";

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

export const CONTAINER_TYPES: FieldType[] = ["group"];

export function isStepEligible(type: FieldType): boolean {
  return type !== "hidden" && type !== "submit";
}
