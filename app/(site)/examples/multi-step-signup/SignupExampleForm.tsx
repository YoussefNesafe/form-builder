"use client";

import { ExampleForm } from "@/components/examples/ExampleForm";
import { multiStepSignupConfig } from "./config";
import { sendOtpStub, verifyOtpStub } from "./otpStub";

/**
 * Client-only wrapper that owns the otp stub wiring. The page itself is a
 * Server Component — functions can't cross a Server->Client prop boundary
 * (Next.js rejects it at build time), so the handlers are imported and
 * applied here instead of being passed down from the page.
 */
export function SignupExampleForm() {
  return <ExampleForm config={multiStepSignupConfig} onSendOtp={sendOtpStub} onVerifyOtp={verifyOtpStub} />;
}
