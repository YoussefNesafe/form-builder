"use client";

import { useState } from "react";
import { registerField } from "@/form-builder/core/registry";
import { FormRenderer } from "@/form-builder/components/FormRenderer";
import { SelectField } from "@/form-builder/fields/SelectField";
import { SubmitField } from "@/form-builder/fields/SubmitField";
import { TextField } from "@/form-builder/fields/TextField";
import { Button } from "@/components/ui/button";
import { StaticExampleBoundary } from "@/components/examples/StaticExampleBoundary";
import { home } from "@/locales/en/home";
import { landingDemoConfig } from "./demoConfig";

const LANDING_DEMO_RENDERERS = {
  select: SelectField,
  text: TextField,
  email: TextField,
  submit: SubmitField,
} as const;
for (const [type, renderer] of Object.entries(LANDING_DEMO_RENDERERS)) {
  registerField(type, renderer);
}
export const LANDING_DEMO_REGISTERED_TYPES = Object.keys(LANDING_DEMO_RENDERERS);

export function LandingDemoForm() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="flex flex-col gap-[4.272vw] tablet:gap-[2vw] desktop:gap-[0.832vw]">
      {!submitted && (
        <StaticExampleBoundary>
          <FormRenderer config={landingDemoConfig} onSubmit={() => setSubmitted(true)} />
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
        {submitted ? home.hero.submittedMessage : null}
      </p>
      {submitted && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="self-start"
          onClick={() => setSubmitted(false)}
        >
          {home.hero.tryAgain}
        </Button>
      )}
    </div>
  );
}
