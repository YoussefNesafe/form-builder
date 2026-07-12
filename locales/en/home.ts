/**
 * Landing page chrome copy (app/(site)/page.tsx and its components/home/*
 * sections). Structural data (hrefs, icon refs, the demo FormConfig, real
 * config objects the showcase/flagship code peeks are generated from) stays
 * in components/home/content.ts — this file is strings only.
 *
 * Section rhythm: hero (split) -> showcase (grid) -> flagship (split) ->
 * capabilities (panel) -> comparison (table). Every section closes with the
 * shared CTA pair (`ctas`, rendered by components/home/SectionCtas.tsx).
 */
export const home = {
  /** Shared CTA pair — hero renders it large, SectionCtas repeats it at the end of every other section. */
  ctas: {
    openBuilder: "Open the builder",
    readDocs: "Read the docs",
  },
  hero: {
    /**
     * "{accent}" marks where the accent-colored word is spliced in by
     * HeroSection via String.split — fmt() does NOT process this marker
     * (fmt's {name} interpolation is a separate mechanism).
     */
    title: "Ship forms your team actually {accent}.",
    titleAccent: "owns",
    subtitle:
      "A visual builder that exports real, Zod- and React Hook Form–validated React — you own the code, not a hosted widget.",
    /** sr-only heading over the live demo panel — the mono tab carries the visual label. */
    panelHeading: "Live demo",
    submittedMessage: "Submitted.",
    tryAgain: "Try again",
  },
  showcase: {
    title: "See it running",
    cards: {
      conditionalProfile: {
        kicker: "Conditions",
        title: "Conditional profile",
        description: "Three fields wired to each other: visibleWhen, optionsFrom, countryFrom.",
      },
      advancedFields: {
        kicker: "Field types",
        title: "Advanced fields",
        description: "Masked input, sibling-bound dates, signature capture — still just field configs.",
      },
      builder: {
        kicker: "Builder",
        title: "Visual builder",
        description: "Drag fields, wire conditions, hit export. Same FormConfig shape as everything else here.",
      },
    },
  },
  flagship: {
    /** Visible, left-aligned section heading — the mono tabs below name the two panes, this names the section. */
    title: "One config. Two views.",
    intro: "This form. That code. No translation layer.",
    codeTabLabel: "signup.config.ts",
    previewTabLabel: "preview",
    codeAriaLabel: "Multi-step signup config source",
    /** sr-only h3 over the code pane, parallel to previewHeading — lets heading-nav reach both panes under the section h2. */
    codeHeading: "Config source",
    /** sr-only h3 over the live preview pane — the mono tab carries the visual label. */
    previewHeading: "Live preview",
    /** next/dynamic loading fallback for the preview pane — only visible on a client-side chunk fetch, since it SSRs by default. */
    previewLoading: "Loading the live form…",
    submittedMessage: "Submitted.",
    tryAgain: "Try again",
  },
  capabilities: {
    title: "What's already handled.",
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
    title: "Pick your tradeoff.",
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
      customFieldTypes: {
        capability: "Custom field types",
        hosted: "Not supported",
        handRolled: "Yes — you write the component",
        engine: "Yes — registerField(), same registry as built-ins",
      },
      offlineNoLockIn: {
        capability: "Works without a vendor's servers",
        hosted: "No — renders and validates through their API",
        handRolled: "Yes",
        engine: "Yes — no runtime dependency on us",
      },
      pricing: {
        capability: "Pricing",
        hosted: "Per-response or per-seat",
        handRolled: "Free — but you built it",
        engine: "Free — MIT license, no seats",
      },
    },
  },
} as const;
