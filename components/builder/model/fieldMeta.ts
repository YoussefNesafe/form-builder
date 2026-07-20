import type { FieldType } from "@/form-builder";
import type { FieldIconName } from "../ui/FieldIcon";

export type FieldGroup = "Text" | "Choice" | "Date & Time" | "Advanced" | "Layout";

export type FieldMeta = {
  group: FieldGroup;
  icon: FieldIconName;
};

export const FIELD_META: Record<FieldType, FieldMeta> = {
  text: { group: "Text", icon: "Type" },
  email: { group: "Text", icon: "Mail" },
  textarea: { group: "Text", icon: "AlignLeft" },
  password: { group: "Text", icon: "KeyRound" },
  masked: { group: "Text", icon: "Asterisk" },
  number: { group: "Text", icon: "Hash" },

  select: { group: "Choice", icon: "ChevronsUpDown" },
  radio: { group: "Choice", icon: "CircleDot" },
  segmented: { group: "Choice", icon: "Columns3" },
  checkbox: { group: "Choice", icon: "SquareCheck" },
  switch: { group: "Choice", icon: "ToggleRight" },
  country: { group: "Choice", icon: "Globe" },

  date: { group: "Date & Time", icon: "Calendar" },
  time: { group: "Date & Time", icon: "Clock" },

  otp: { group: "Advanced", icon: "ShieldCheck" },
  phone: { group: "Advanced", icon: "Phone" },
  rating: { group: "Advanced", icon: "Star" },
  slider: { group: "Advanced", icon: "SlidersHorizontal" },
  signature: { group: "Advanced", icon: "PenLine" },
  file: { group: "Advanced", icon: "Paperclip" },

  static: { group: "Layout", icon: "Heading" },
  hidden: { group: "Layout", icon: "EyeOff" },
  submit: { group: "Layout", icon: "Send" },
  group: { group: "Layout", icon: "Boxes" },
};

export const FIELD_GROUP_ORDER: FieldGroup[] = ["Text", "Choice", "Date & Time", "Advanced", "Layout"];
