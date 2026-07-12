"use client";

import { useState } from "react";
import { sendOtpStub, verifyOtpStub } from "@/app/(site)/examples/multi-step-signup/otpStub";
import { multiStepSignupConfig } from "@/app/(site)/examples/multi-step-signup/config";
import { StaticExampleBoundary } from "@/components/examples/StaticExampleBoundary";
import { Button } from "@/components/ui/button";
import { registerField } from "@/form-builder/core/registry";
import { FormRenderer } from "@/form-builder/components/FormRenderer";
import { OtpField } from "@/form-builder/fields/OtpField";
import { SubmitField } from "@/form-builder/fields/SubmitField";
import { TextField } from "@/form-builder/fields/TextField";
import { home } from "@/locales/en/home";

// Scoped registration, same pattern as LandingDemoForm.tsx — multiStepSignupConfig
// only uses text/email/password/otp/submit (all built-ins map to just these 3
// components; text/email/password all render via TextField, see
// form-builder/fields/index.ts). Deliberately does NOT import
// components/examples/ExampleForm.tsx, which calls registerBuiltInFields() at
// module scope — that one call pulls all 24 field renderers (react-phone-
// number-input, signature_pad, cmdk, ...) into whatever bundle imports it.
// The /examples route keeps using ExampleForm as-is; this is the landing-
// page-only lean equivalent. FormRenderer/registerField are imported from
// their concrete source files, NOT the `@/form-builder` barrel — the barrel
// (form-builder/index.ts) also re-exports `registerBuiltInFields`, and with
// no `sideEffects: false` in package.json, Turbopack keeps that unused
// re-export's whole dependency chain (all 24 field files) in this bundle
// even though it's never called. Confirmed via
// `.next/server/app/(site)/page_client-reference-manifest.js` after a real
// `next build`: before this, FlagshipSignupForm/LandingDemoForm's own chunk
// (not registerBuiltInFields anywhere on this route) still pulled in
// react-phone-number-input and friends purely from the barrel import.
const FLAGSHIP_RENDERERS = {
  text: TextField,
  email: TextField,
  password: TextField,
  otp: OtpField,
  submit: SubmitField,
} as const;
for (const [type, renderer] of Object.entries(FLAGSHIP_RENDERERS)) {
  registerField(type, renderer);
}
// Pinned by scopedRegistration.test.ts: must cover every field type
// multiStepSignupConfig uses, or the boundary shows a render error at runtime.
export const FLAGSHIP_REGISTERED_TYPES = Object.keys(FLAGSHIP_RENDERERS);

/**
 * Flagship split's live pane: just the wizard — no submitted-payload readout
 * or raw-config <details> (that's /examples chrome, not a marketing moment,
 * same reasoning as LandingDemoForm next to ExampleForm). Config and OTP
 * stubs are imported straight from the /examples route, not duplicated.
 * Reuses LandingDemoForm's unmount/remount-on-reset pattern: submitting hides
 * the wizard, "Try again" remounts a fresh FormRenderer instead of hand-
 * rolling a stepper reset.
 */
export function FlagshipSignupForm() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="flex flex-col gap-[4.272vw] tablet:gap-[2vw] desktop:gap-[0.832vw]">
      {!submitted && (
        <StaticExampleBoundary>
          <FormRenderer
            config={multiStepSignupConfig}
            onSubmit={() => setSubmitted(true)}
            onSendOtp={sendOtpStub}
            onVerifyOtp={verifyOtpStub}
          />
        </StaticExampleBoundary>
      )}
      <p
        role="status"
        className={
          submitted
            ? "text-[3.738vw] tablet:text-[1.75vw] desktop:text-[0.728vw] text-muted-foreground"
            : "sr-only"
        }
      >
        {submitted ? home.flagship.submittedMessage : null}
      </p>
      {submitted && (
        <Button type="button" variant="outline" size="sm" className="self-start" onClick={() => setSubmitted(false)}>
          {home.flagship.tryAgain}
        </Button>
      )}
    </div>
  );
}
