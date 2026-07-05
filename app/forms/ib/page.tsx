import type { FormConfig } from "@/form-builder";
import { AccountFormClient } from "../AccountFormClient";
import { countryOptions } from "../countries";

const config: FormConfig = {
  id: "ib-registration",
  fields: [
    { type: "static", name: "heading", content: "Quick & Easy IB Registration", as: "h1" },
    { type: "static", name: "subheading", content: "Start by completing our simple registration form" },
    { type: "text", name: "firstName", label: "First Name", required: true, colSpan: 2 },
    { type: "text", name: "lastName", label: "Last Name", required: true, colSpan: 2 },
    { type: "email", name: "email", label: "Email", required: true },
    {
      type: "select",
      name: "countryOfResidence",
      label: "Country of Residence",
      placeholder: "Select Country",
      searchable: true,
      required: true,
      options: countryOptions,
    },
    {
      type: "select",
      name: "expectedInvestment",
      label: "Expected investment amount in USD",
      placeholder: "Select Expected investment amount",
      required: true,
      options: [
        { label: "$1,000-$20,000", value: "1000-20000" },
        { label: "$20,001-$50,000", value: "20001-50000" },
        { label: "$50,001-$200,000", value: "50001-200000" },
        { label: "$200,001-$1,000,000", value: "200001-1000000" },
        { label: "Above $1,000,001", value: "1000001+" },
      ],
    },
    {
      type: "radio",
      name: "existingIb",
      label: "Are you an existing IB with another broker?",
      required: true,
      options: [
        { label: "Yes", value: "yes" },
        { label: "No", value: "no" },
      ],
    },
    {
      type: "text",
      name: "currentBroker",
      label: "Current broker name",
      required: true,
      visibleWhen: { field: "existingIb", equals: "yes" },
    },
    {
      type: "password",
      name: "password",
      label: "Create Password",
      required: true,
      rules: { minLength: 8 },
    },
    {
      type: "static",
      name: "consent",
      content:
        "By clicking submit I confirm that I have read, understood and agree to the terms set out in the Risk Disclosure Statement, Electronic Trading Terms and Client Agreement.",
    },
    { type: "submit", name: "submit", text: "Get Started" },
  ],
};

export default function IbRegistrationPage() {
  return <AccountFormClient config={config} />;
}
