"use client";

import { useState } from "react";
import { FormRenderer, registerBuiltInFields } from "@/form-builder";
import { Button } from "@/components/ui/button";
import { FormBoundary } from "@/components/examples/FormBoundary";
import { landingDemoConfig } from "./config";

// Field runtime must be registered before FormRenderer mounts. Safe to call
// more than once (registerField just overwrites the same map entry).
registerBuiltInFields();

/**
 * Hero-panel demo: the real FormRenderer, not a mock. Deliberately minimal
 * next to components/examples/ExampleForm.tsx (no submitted-payload readout,
 * no raw-config <details>) — those are docs/examples chrome, not a marketing
 * moment. This is the only 'use client' leaf on the landing page; the rest
 * of app/page.tsx stays a Server Component.
 */
export function LandingDemoForm() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="flex flex-col gap-[16px] tablet:gap-[16px] desktop:gap-[16px]">
      {!submitted && (
        <FormBoundary>
          <FormRenderer config={landingDemoConfig} onSubmit={() => setSubmitted(true)} />
        </FormBoundary>
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
        {submitted ? "Submitted — this is a live demo, nothing was sent anywhere." : null}
      </p>
      {submitted && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="self-start"
          onClick={() => setSubmitted(false)}
        >
          Try again
        </Button>
      )}
    </div>
  );
}
