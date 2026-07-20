import type { FormConfig } from "@/form-builder";

export const firstFormConfig: FormConfig = {
  id: "your-first-form",
  fields: [
    { type: "text", name: "name", label: "Name", required: true },
    { type: "email", name: "email", label: "Email", required: true },
    { type: "submit", name: "submit", text: "Submit" },
  ],
};
