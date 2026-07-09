import type { FieldType } from "@/form-builder";

export type FieldGroup = "Text" | "Choice" | "Date & Time" | "Advanced" | "Layout";

export type FieldMeta = {
  label: string;
  group: FieldGroup;
  /** lucide-react icon name (rendered in Phase 3). */
  icon: string;
};

/** Display label, add-menu grouping, and icon for every built-in field type. */
export const FIELD_META: Record<FieldType, FieldMeta> = {
  text: { label: "Text", group: "Text", icon: "Type" },
  email: { label: "Email", group: "Text", icon: "Mail" },
  textarea: { label: "Textarea", group: "Text", icon: "AlignLeft" },
  password: { label: "Password", group: "Text", icon: "KeyRound" },
  masked: { label: "Masked", group: "Text", icon: "Asterisk" },
  number: { label: "Number", group: "Text", icon: "Hash" },

  select: { label: "Select", group: "Choice", icon: "ChevronsUpDown" },
  radio: { label: "Radio", group: "Choice", icon: "CircleDot" },
  segmented: { label: "Segmented", group: "Choice", icon: "Columns3" },
  checkbox: { label: "Checkbox", group: "Choice", icon: "SquareCheck" },
  switch: { label: "Switch", group: "Choice", icon: "ToggleRight" },
  country: { label: "Country", group: "Choice", icon: "Globe" },

  date: { label: "Date", group: "Date & Time", icon: "Calendar" },
  time: { label: "Time", group: "Date & Time", icon: "Clock" },

  otp: { label: "OTP", group: "Advanced", icon: "ShieldCheck" },
  phone: { label: "Phone", group: "Advanced", icon: "Phone" },
  rating: { label: "Rating", group: "Advanced", icon: "Star" },
  slider: { label: "Slider", group: "Advanced", icon: "SlidersHorizontal" },
  signature: { label: "Signature", group: "Advanced", icon: "PenLine" },
  file: { label: "File", group: "Advanced", icon: "Paperclip" },

  static: { label: "Static text", group: "Layout", icon: "Heading" },
  hidden: { label: "Hidden", group: "Layout", icon: "EyeOff" },
  submit: { label: "Submit button", group: "Layout", icon: "Send" },
  group: { label: "Group (repeatable)", group: "Layout", icon: "Boxes" },
};

/** Add-menu groups in display order. */
export const FIELD_GROUP_ORDER: FieldGroup[] = ["Text", "Choice", "Date & Time", "Advanced", "Layout"];
