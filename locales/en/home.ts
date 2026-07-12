/**
 * Landing page chrome copy (app/(site)/page.tsx and its components/home/*
 * sections). Structural data (hrefs, icon refs, the demo FormConfig, the
 * exported-code snippet) stays in components/home/content.ts — this file is
 * strings only.
 */
export const home = {
  hero: {
    /**
     * "{accent}" marks where the accent-colored word is spliced in by
     * HeroSection via String.split — fmt() does NOT process this marker
     * (fmt's {name} interpolation is a separate mechanism).
     */
    title: "Build the form visually. Ship the {accent}.",
    titleAccent: "code",
    subtitle:
      "A visual builder that exports real Zod- and React Hook Form–validated React — you own the code, not a hosted widget.",
    ctaBuilder: "Open the builder",
    ctaDocs: "Read the docs",
  },
  showcase: {
    title: "See it in action",
    cards: {
      multiStepSignup: {
        kicker: "Wizard",
        title: "Multi-step signup",
        description:
          "A three-step wizard: account details with confirm-password, email OTP verification, and a read-only review step.",
      },
      conditionalProfile: {
        kicker: "Conditions",
        title: "Conditional profile",
        description:
          "visibleWhen-conditional fields, an optionsFrom-derived select, and a phone field synced to a country field.",
      },
      advancedFields: {
        kicker: "Advanced fields",
        title: "Advanced fields",
        description: "Masked input, date/time fields with sibling bounds, rating, segmented, slider, signature, and file.",
      },
      builder: {
        kicker: "Builder",
        title: "Visual builder",
        description:
          "A visual builder that exports real Zod- and React Hook Form–validated React — you own the code, not a hosted widget.",
      },
    },
  },
  demo: {
    title: "Try it right here",
    subtitle: 'Pick "Company" to see a conditional field appear — this is the real engine, not a screenshot.',
    footnote: "Live — this is the actual FormRenderer, not a mock.",
    submittedMessage: "Submitted — this is a live demo, nothing was sent anywhere.",
    tryAgain: "Try again",
  },
  split: {
    builderCanvasLabel: "Builder canvas",
    exportedCodeLabel: "Exported code",
    codeBlockLabel: "Exported form code",
  },
  features: {
    title: "Everything a real form needs",
    items: {
      fieldTypes: {
        title: "24 built-in field types",
        description: "Text, phone, OTP, signature, masked input, rating, and more — one component per type.",
      },
      conditionalLogic: {
        title: "Conditional logic",
        description: "Show, hide, enable, or disable fields with visibleWhen — no imperative wiring.",
      },
      wizards: {
        title: "Multi-step wizards",
        description: "Step-gated validation, conditional steps, and a read-only review step before submit.",
      },
      crossFieldValidation: {
        title: "Cross-field validation",
        description: "Matching passwords, sibling date/time bounds — enforced by a form-level rule.",
      },
      otp: {
        title: "OTP verification flows",
        description: "Send/verify codes per field, with submit gated on a verified-code registry.",
      },
      autosave: {
        title: "Autosave + draft restore",
        description: "Drafts persist as the user types and restore on return, without extra config.",
      },
    },
  },
  comparison: {
    title: "How it compares",
    columns: {
      capability: "Capability",
      hosted: "Hosted builders",
      handRolled: "Hand-rolled RHF",
      engine: "This engine",
    },
    rows: {
      ownCode: {
        capability: "Own the generated code",
        hosted: "No — locked to a hosted runtime",
        handRolled: "Yes — but every line is yours to write",
        engine: "Yes — copy it into your app",
      },
      typeSafeValidation: {
        capability: "Type-safe Zod validation",
        hosted: "Varies by platform",
        handRolled: "Yes — hand-written schema per form",
        engine: "Yes — generated from the config",
      },
      conditionalLogic: {
        capability: "Conditional logic & wizards",
        hosted: "Limited, platform-specific",
        handRolled: "Yes — you build the state machine",
        engine: "Yes — visibleWhen + step config",
      },
    },
  },
  finalCta: {
    title: "Stop hand-wiring the same form again.",
    cta: "Open the builder",
  },
  /** Shared decorative chip labels — used by both the showcase "builder" preview and the builder-canvas mock. */
  builderChips: ["Email", "Password", "Country", "Submit"] as const,
} as const;
