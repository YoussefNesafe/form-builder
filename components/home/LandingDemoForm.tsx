"use client";

import { useState } from "react";
import { FormRenderer, registerField } from "@/form-builder";
import { SelectField } from "@/form-builder/fields/SelectField";
import { SubmitField } from "@/form-builder/fields/SubmitField";
import { TextField } from "@/form-builder/fields/TextField";
import { Button } from "@/components/ui/button";
import { StaticExampleBoundary } from "@/components/examples/StaticExampleBoundary";
import { home } from "@/locales/en/home";
import { landingDemoConfig } from "./demoConfig";

// Field runtime must be registered before FormRenderer mounts. Safe to call
// more than once (registerField just overwrites the same map entry).
// Deliberately NOT registerBuiltInFields(): that pulls all 24 field renderers
// (~288 KB gzip incl. phone/signature libs) into the landing bundle, while
// demoConfig only uses select/text/email/submit. Adding a field type to the
// demo config? Register it here too, or the boundary shows a render error.
registerField("select", SelectField);
registerField("text", TextField);
registerField("email", TextField);
registerField("submit", SubmitField);

/**
 * Hero-panel demo: the real FormRenderer, not a mock. Deliberately minimal
 * next to components/examples/ExampleForm.tsx (no submitted-payload readout,
 * no raw-config <details>) — those are docs/examples chrome, not a marketing
 * moment. This is the only 'use client' leaf on the landing page; the rest
 * of app/(site)/page.tsx and components/home/* stay Server Components.
 * Imports the `home` dictionary slice directly (not the aggregated `t`) to
 * keep this client bundle from pulling in every other locale domain.
 */
export function LandingDemoForm() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="flex flex-col gap-[16px] tablet:gap-[16px] desktop:gap-[16px]">
      {!submitted && (
        <StaticExampleBoundary>
          <FormRenderer config={landingDemoConfig} onSubmit={() => setSubmitted(true)} />
        </StaticExampleBoundary>
      )}
      {/* Persistent live region — content toggles in place so the submit
          announcement is reliable, instead of mounting role="status" fresh. */}
      <p
        role="status"
        className={
          submitted
            ? "text-[14px] tablet:text-[14px] desktop:text-[14px] text-muted-foreground"
            : "sr-only"
        }
      >
        {submitted ? home.demo.submittedMessage : null}
      </p>
      {submitted && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="self-start"
          onClick={() => setSubmitted(false)}
        >
          {home.demo.tryAgain}
        </Button>
      )}
    </div>
  );
}
