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
      typeSafety: "Type safety",
      submitToBackend: "Submit to backend",
      fieldTypes: "Field types",
    },
  },
  codeBlock: {
    defaultLabel: "code",
    copyAriaLabel: "Copy {label}",
    copied: "Copied",
  },
  index: {
    title: "Docs",
    intro: {
      prefix: "The engine is copy-in code you own, not a hosted widget — same model as shadcn/ui. Start with ",
      installationLink: "Installation",
      betweenInstallationAndFirstForm: ", then build ",
      yourFirstFormLink: "your first form",
      betweenFirstFormAndExamples: ". For conditional fields, multi-step wizards, and cross-field wiring in action, see ",
      examplesLink: "Examples",
      suffix: ".",
    },
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
      typeSafety:
        "defineForm and InferValues — a typed submit payload straight from your config, the value-type table, and the conditional-optional rule.",
      submitToBackend:
        "The typed wire end to end: createFormAction for Server Actions, parseSubmission direct for Route Handlers, and applyServerErrors on the way back.",
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
