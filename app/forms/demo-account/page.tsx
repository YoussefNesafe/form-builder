import type { FormConfig } from "@/form-builder";
import { AccountFormClient } from "../AccountFormClient";

const config: FormConfig = {
  id: "demo-account",
  fields: [
    {
      type: "static",
      name: "heading",
      content: "Open a Demo Account",
      as: "h1",
    },
    { type: "static", name: "subheading", content: "Enjoy risk-free trading!" },
    {
      type: "text",
      name: "firstName",
      placeholder: "First Name",
      required: true,
      colSpan: 2,
    },
    {
      type: "text",
      name: "lastName",
      placeholder: "Last Name",
      required: true,
      colSpan: 2,
    },
    { type: "email", name: "email", placeholder: "Email", required: true },
    {
      type: "password",
      name: "password",
      label: "Create Password",
      required: true,
      rules: { minLength: 8 },
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

export default function DemoAccountPage() {
  return <AccountFormClient config={config} />;
}
