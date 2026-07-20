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
export const FLAGSHIP_REGISTERED_TYPES = Object.keys(FLAGSHIP_RENDERERS);

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
