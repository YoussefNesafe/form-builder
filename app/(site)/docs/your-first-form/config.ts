import type { FormConfig } from "@/form-builder";

/**
 * The minimal form this tutorial builds: two fields and a submit button.
 * Rendered live on the page via <ExampleForm>, and its literal source is
 * what the code block on the page shows — keep the two in sync.
 */
export const firstFormConfig: FormConfig = {
  id: "your-first-form",
  fields: [
    { type: "text", name: "name", label: "Name", required: true },
    { type: "email", name: "email", label: "Email", required: true },
    { type: "submit", name: "submit", text: "Submit" },
  ],
};
