import type { FormConfig } from "@/form-builder";
import { AccountFormClient } from "../AccountFormClient";
import { countryOptions } from "../countries";

const config: FormConfig = {
  id: "live-account",
  fields: [
    {
      type: "static",
      name: "heading",
      content: "Open a Live Account",
      as: "h1",
    },
    {
      type: "static",
      name: "subheading",
      content: "and start trading in 2 minutes",
    },
    {
      type: "text",
      name: "firstName",
      label: "First Name",
      required: true,
      colSpan: 2,
      rules: { minLength: 2, pattern: "^[A-Za-z ]+$", trim: true, message: "Only letters and spaces are allowed" },
    },
    {
      type: "text",
      name: "lastName",
      label: "Last Name",
      required: true,
      colSpan: 2,
      rules: { minLength: 2, pattern: "^[A-Za-z ]+$", trim: true, message: "Only letters and spaces are allowed" },
    },
    { type: "email", name: "email", label: "Email", required: true },
    {
      type: "select",
      name: "nationality",
      label: "Nationality",
      placeholder: "Select Country",
      searchable: true,
      required: true,
      options: countryOptions,
    },
    {
      type: "date",
      name: "dateOfBirth",
      label: "Date of Birth",
      required: true,
      maxDate: "2008-07-05",
      placeholder: "DD / MM / YYYY",
    },
    {
      type: "password",
      name: "password",
      label: "Create Password",
      required: true,
      complexity: { uppercase: true, lowercase: true, number: true, special: true, minLength: 8 },
    },
    {
      type: "phone",
      name: "phone",
      label: "Phone Number",
      defaultCountry: "AE",
      required: true,
    },
    {
      type: "otp",
      name: "otp",
      label: "Verification Code (OTP)",
      length: 6,
      required: true,
      dependsOn: "phone",
    },
    {
      type: "static",
      name: "consent",
      content:
        "By clicking Submit, I confirm that: (1) I have read, understood and agree to the Client Agreements, (2) I give my consent to be contacted at any reasonable time, and (3) my number is not registered on a DNCR (Do Not Call Register).",
    },
    { type: "submit", name: "submit", text: "Submit" },
  ],
};

export default function LiveAccountPage() {
  return <AccountFormClient config={config} />;
}
