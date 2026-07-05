import type { TextRules } from "@/form-builder";

export const nameRules: TextRules = {
  minLength: 2,
  pattern: "^[A-Za-z ]+$",
  trim: true,
  allow: "A-Za-z ",
  message: "Only letters and spaces are allowed",
};
