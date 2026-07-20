import type { FormConfig } from "@/form-builder";

export const wizardDemoConfig: FormConfig = {
  id: "wizard-demo",
  title: "Quick signup",
  fields: [
    { type: "text", name: "fullName", label: "Full name", required: true },
    { type: "email", name: "email", label: "Email", required: true },
    {
      type: "select",
      name: "plan",
      label: "Plan",
      required: true,
      options: [
        { label: "Free", value: "free" },
        { label: "Pro", value: "pro" },
      ],
    },
    { type: "submit", name: "submit", text: "Create account" },
  ],
  steps: [
    { title: "Account", fieldNames: ["fullName", "email"] },
    { title: "Plan", fieldNames: ["plan"] },
    { title: "Review", review: true },
  ],
};
