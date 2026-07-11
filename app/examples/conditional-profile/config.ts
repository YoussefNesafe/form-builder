import type { FormConfig } from "@/form-builder";

/**
 * Single-step form showing three wiring features: visibleWhen (companyName
 * only shows for accountType "company"), select optionsFrom another select
 * (billingCycle branches on plan), and a phone field synced to a country
 * field via countryFrom.
 */
export const conditionalProfileConfig: FormConfig = {
  id: "conditional-profile",
  title: "Profile",
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
    {
      type: "select",
      name: "plan",
      label: "Plan",
      required: true,
      width: "half",
      options: [
        { label: "Free", value: "free" },
        { label: "Pro", value: "pro" },
        { label: "Enterprise", value: "enterprise" },
      ],
    },
    {
      type: "select",
      name: "billingCycle",
      label: "Billing cycle",
      width: "half",
      optionsFrom: {
        field: "plan",
        map: {
          free: [{ label: "Monthly", value: "monthly" }],
          pro: [
            { label: "Monthly", value: "monthly" },
            { label: "Annual", value: "annual" },
          ],
          enterprise: [
            { label: "Annual", value: "annual" },
            { label: "Custom", value: "custom" },
          ],
        },
      },
    },
    { type: "country", name: "country", label: "Country", required: true, width: "half" },
    { type: "phone", name: "phone", label: "Phone", countryFrom: "country", width: "half" },
    { type: "submit", name: "submit", text: "Save profile" },
  ],
};
