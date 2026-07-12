/**
 * /examples site chrome: the index page (title/intro/per-slug card copy),
 * each example page's own title (+ description where it's a plain string —
 * multi-step-signup's demo note has an inline `<code>` so it's split into
 * prefix/suffix segments the same way docs.index.intro splits around its
 * links), and shared ExampleForm/StaticExampleBoundary chrome. Note: the showcase
 * cards on the landing page (locales/en/home.ts) intentionally duplicate
 * these descriptions with different wording — left as-is, not
 * cross-referenced, per that file's own comment.
 */
export const examples = {
  index: {
    title: "Examples",
    intro: "Live forms rendered by the engine through its public API — the same `FormRenderer` you'd import into your own app.",
    cards: {
      multiStepSignup: {
        title: "Multi-step signup",
        description:
          "A three-step wizard: account details with confirm-password, email OTP verification, and a read-only review step.",
      },
      conditionalProfile: {
        title: "Conditional profile",
        description:
          "visibleWhen-conditional fields, an optionsFrom-derived select, and a phone field synced to a country field.",
      },
      advancedFields: {
        title: "Advanced fields",
        description: "Masked input, date/time fields with sibling bounds, rating, segmented, slider, signature, and file.",
      },
    },
  },
  multiStepSignup: {
    title: "Multi-step signup",
    description:
      "Account details with a confirm-password check, email OTP verification, then a read-only review step with per-step edit links.",
    notePrefix: "Demo only — there is no real email backend here. Enter ",
    noteSuffix: " as the verification code.",
  },
  conditionalProfile: {
    title: "Conditional profile",
    description:
      "Company name only appears once you pick \"Company\", billing cycle options come from the plan you picked, and the phone field's country flag follows the country field.",
  },
  advancedFields: {
    title: "Advanced fields",
    description:
      "Masked input, date and time pairs that enforce end-after-start, rating, segmented, slider, signature, and file — each backed by a built-in field type.",
  },
  /** Shared ExampleForm (components/examples/ExampleForm.tsx) chrome. */
  form: {
    submittedValuesLabel: "Submitted values",
    viewConfig: "View config",
    configJsonLabel: "Config JSON",
  },
  /** StaticExampleBoundary (components/examples/StaticExampleBoundary.tsx) render-error chrome. */
  boundary: {
    failedTitle: "This example failed to render",
  },
} as const;
