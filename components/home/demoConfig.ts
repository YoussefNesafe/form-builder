import type { FormConfig } from "@/form-builder";

export const landingDemoConfig: FormConfig = {
  id: "landing-demo",
  title: "Contact",
  fields: [
    {
      type: "select",
      name: "accountType",
      label: "Account type",
      required: true,
      options: [
        { label: "Individual", value: "individual" },
        { label: "Company", value: "company" },
      ],
    },
    {
      type: "text",
      name: "companyName",
      label: "Company name",
      required: true,
      visibleWhen: { field: "accountType", equals: "company" },
    },
    { type: "email", name: "email", label: "Email", required: true },
    { type: "submit", name: "submit", text: "Get started" },
  ],
};
