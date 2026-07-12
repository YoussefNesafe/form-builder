import type { FormConfig } from "@/form-builder";

/**
 * Minimal visibleWhen showcase for the Conditions doc page: companyName only
 * appears once accountType is "company". The fuller demo (optionsFrom,
 * phone countryFrom) lives at /examples/conditional-profile.
 */
export const conditionsDemoConfig: FormConfig = {
  id: "conditions-demo",
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
    { type: "submit", name: "submit", text: "Continue" },
  ],
};
