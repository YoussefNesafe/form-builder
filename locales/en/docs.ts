/**
 * Docs site chrome — DocsToc/DocsPagination/DocsBreadcrumb shell strings,
 * the docsNav (lib/docsNav.ts) group/page titles, the docs index page
 * (title/intro/per-slug card descriptions), and the shared metadata titles
 * every docs content page reuses. Long-form docs prose (the actual H2
 * section bodies on installation/your-first-form/conditions/wizards/
 * field-types) is NOT extracted here — staff-engineer ruling: multi-
 * paragraph prose with inline `<code>`/links stays in JSX where it lives.
 */
export const docs = {
  toc: {
    onThisPage: "On this page",
  },
  pagination: {
    label: "Docs pagination",
    previous: "Previous",
    next: "Next",
  },
  breadcrumb: {
    label: "Breadcrumb",
    docs: "Docs",
  },
  /** Sidebar/pagination structural data (lib/docsNav.ts) — titles only; hrefs/grouping stay in docsNav.ts. */
  nav: {
    groups: {
      overview: "Overview",
      gettingStarted: "Getting started",
      concepts: "Concepts",
      reference: "Reference",
    },
    pages: {
      overview: "Overview",
      installation: "Installation",
      yourFirstForm: "Your first form",
      conditions: "Conditions",
      wizards: "Multi-step wizards",
      serverValidation: "Server-side validation",
      fieldTypes: "Field types",
    },
  },
  /** CopyButton (components/docs/CopyButton.tsx) — icon button on copy-enabled CodeBlocks. `copyAriaLabel`'s `{label}` is the noun each call site passes (e.g. "command", "CSS"). */
  codeBlock: {
    defaultLabel: "code",
    copyAriaLabel: "Copy {label}",
    copied: "Copied",
  },
  index: {
    title: "Docs",
    /**
     * The index intro paragraph has two inline `<Link>`s baked mid-sentence
     * — split into the surrounding plain-text segments so the links stay
     * real JSX (same treatment as examples.multiStepSignup's demo note).
     */
    intro: {
      prefix: "The engine is copy-in code you own, not a hosted widget — same model as shadcn/ui. Start with ",
      installationLink: "Installation",
      betweenInstallationAndFirstForm: ", then build ",
      yourFirstFormLink: "your first form",
      betweenFirstFormAndExamples: ". For conditional fields, multi-step wizards, and cross-field wiring in action, see ",
      examplesLink: "Examples",
      suffix: ".",
    },
    /** Index card descriptions, keyed by page slug (not the page's own metadata title). */
    descriptions: {
      installation:
        "Run one CLI command to copy the engine, every field, and the shadcn primitives into a self-contained folder — or copy form-builder/ in by hand.",
      yourFirstForm:
        "A minimal FormConfig — two fields and a submit button — rendered live, plus what you get for free.",
      conditions:
        "visibleWhen, disabledWhen, and enabledWhen — the real Condition operators, the isValid oracle, and the group-nesting limitation.",
      wizards: "The steps config shape, Next/Back gating, conditional steps, and the read-only review step.",
      serverValidation:
        "parseSubmission — the server-side trust boundary for a submitted config. Route Handler/Server Action recipes, the fail-closed otp pattern, and every documented sharp edge.",
      fieldTypes:
        "Every built-in field type the registry ships, generated from the package's own type list so it can't drift.",
    },
    footnote: {
      prefix: "The full config shape is defined by the ",
      formConfig: "FormConfig",
      and: " and ",
      fieldConfig: "FieldConfig",
      typesIn: " types in ",
      coreTypes: "form-builder/core/types.ts",
      suffix: " — the package's single source of truth.",
    },
  },
} as const;
