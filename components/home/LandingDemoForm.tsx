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

// Field runtime must be registered before FormRenderer mounts. Safe to call
// more than once (registerField just overwrites the same map entry).
// Deliberately NOT registerBuiltInFields(): that pulls all 24 field renderers
// (~288 KB gzip incl. phone/signature libs) into the landing bundle, while
// demoConfig only uses select/text/email/submit. Adding a field type to the
// demo config? Register it here too, or the boundary shows a render error.
// FormRenderer/registerField are imported from their concrete source files,
// NOT the `@/form-builder` barrel (form-builder/index.ts) — that barrel also
// re-exports `registerBuiltInFields`, and with no `sideEffects: false` in
// package.json, Turbopack keeps the unused re-export's whole dependency
// chain (all 24 field files) in this bundle even though it's never called.
// Importing the concrete files sidesteps the barrel entirely. Verified via
// `.next/server/app/(site)/page_client-reference-manifest.js` after a real
// `next build` — see FlagshipSignupForm.tsx for the same fix.
const LANDING_DEMO_RENDERERS = {
  select: SelectField,
  text: TextField,
  email: TextField,
  submit: SubmitField,
} as const;
for (const [type, renderer] of Object.entries(LANDING_DEMO_RENDERERS)) {
  registerField(type, renderer);
}
// Pinned by scopedRegistration.test.ts: must cover every field type
// landingDemoConfig uses, or the boundary shows a render error at runtime.
export const LANDING_DEMO_REGISTERED_TYPES = Object.keys(LANDING_DEMO_RENDERERS);

/**
 * Hero-panel demo: the real FormRenderer, deliberately minimal next to
 * components/examples/ExampleForm.tsx (no submitted-payload readout, no
 * raw-config <details>) — those are docs/examples chrome, not a marketing
 * moment. Rendered inside HeroSection's panel frame. One of exactly two
 * 'use client' leaves on the landing page (the other is FlagshipSignupForm);
 * the rest of app/(site)/page.tsx and
 * components/home/* stay Server Components. Imports the `home` dictionary
 * slice directly (not the aggregated `t`) to keep this client bundle from
 * pulling in every other locale domain.
 */
export function LandingDemoForm() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="flex flex-col gap-[4.272vw] tablet:gap-[2vw] desktop:gap-[0.832vw]">
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
