import type { FormConfig } from "@/form-builder";

/**
 * Three-step wizard: account details (confirm-password via rules.matches),
 * email OTP verification (otp field dependsOn the account step's email —
 * cross-step by design, form-builder dev-warns but supports it), then a
 * read-only review step.
 */
export const multiStepSignupConfig: FormConfig = {
  id: "multi-step-signup",
  title: "Create your account",
  fields: [
    { type: "text", name: "fullName", label: "Full name", required: true, rules: { minLength: 2 } },
    { type: "email", name: "email", label: "Email", required: true },
    {
      type: "password",
      name: "password",
      label: "Password",
      required: true,
      width: "half",
      complexity: { uppercase: true, lowercase: true, number: true, minLength: 8 },
    },
    {
      type: "password",
      name: "confirmPassword",
      label: "Confirm password",
      required: true,
      width: "half",
      rules: { matches: "password", matchesMessage: "Passwords don't match" },
    },
    { type: "otp", name: "emailOtp", label: "Verification code", length: 6, dependsOn: "email" },
    { type: "submit", name: "submit", text: "Create account" },
  ],
  steps: [
    { title: "Account", fieldNames: ["fullName", "email", "password", "confirmPassword"] },
    { title: "Verify", fieldNames: ["emailOtp"] },
    { title: "Review", review: true },
  ],
};
