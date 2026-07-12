/**
 * Visual builder chrome copy (components/builder/**). The builder is a
 * client island — its components import this slice directly
 * (`@/locales/en/builder`), never the aggregate `t`, so unrelated locale
 * data doesn't ride along into the client bundle (same pattern as
 * NavLinks/LandingDemoForm). Structural data — field `name`s/ids, cmdk
 * filter `value`s, sentinels, icon names, serialized output, seed/default
 * data a user immediately overwrites (e.g. "Untitled Form", "Option 1",
 * "Step 1") — stays out of this file; it isn't display copy.
 *
 * `fields.<type>.label`/`description` for the add-field menu and row
 * captions come from `@/locales/en/fieldTypes`, not from here — this file
 * only owns the builder's own chrome (panel headings, buttons, dialogs,
 * control labels/help, aria-labels).
 */
export const builder = {
  header: {
    kicker: "Form Builder",
    titleLabel: "Title",
    descriptionLabel: "Description",
    descriptionPlaceholder: "Optional",
    exportButton: "Export code",
    exportDialogTitle: "Form config",
    exportDialogDescription: "Copy this into a page or your CMS.",
    /**
     * Second dialog line pointing the export moment at the copy-in setup
     * docs — segmented around the inline <Link> (prefix/linkText/suffix
     * pattern, same as docs.index.intro).
     */
    exportInstallPrefix: "New to the engine? See ",
    exportInstallLinkText: "Installation",
    exportInstallSuffix: " for the copy-in setup.",
    resetButton: "Reset",
    resetDialogTitle: "Reset the builder?",
    resetDialogDescription: "This clears every field and step. It cannot be undone.",
    resetCancel: "Cancel",
    resetConfirm: "Reset everything",
  },

  fieldList: {
    heading: "Fields",
    empty: "No fields yet. Add one to get started.",
    addField: "Add field",
    addToGroup: "Add to group",
    unnamed: "(unnamed)",
    assignToStep: "Assign to step…",
    unassigned: "Unassigned",
    /** Fallback shown for a step with no title, e.g. "Step 1". */
    stepFallback: "Step {n}",
    /** SelectTrigger aria-label, e.g. "Step for email". */
    stepAriaLabel: "Step for {name}",
    actions: {
      moveUp: "Move up",
      moveDown: "Move down",
      duplicate: "Duplicate",
      delete: "Delete",
    },
    /** Add-field-menu group headings — display text for FIELD_META's FieldGroup keys. */
    groups: {
      Text: "Text",
      Choice: "Choice",
      "Date & Time": "Date & Time",
      Advanced: "Advanced",
      Layout: "Layout",
    },
  },

  preview: {
    heading: "Preview",
    /** e.g. "Demo OTP code: 123456". */
    demoOtpCode: "Demo OTP code: {code}",
    submittedValues: "Submitted values",
    empty: "Add a field to see the live preview.",
    invalidTitle: "Config not valid yet",
  },

  output: {
    modeTs: "TypeScript",
    modeJson: "JSON",
    copy: "Copy",
    copied: "Copied",
    /** e.g. "Not valid yet: duplicate field name". */
    notValidYet: "Not valid yet: {error}",
    addAtLeastOneField: "Add at least one field.",
    formatAriaLabel: "Output format",
  },

  steps: {
    multiStepLabel: "Multi-step form",
    emptyStepsWarning: "Add a step and assign your fields, or the export drops the steps.",
    noFieldsAssignedWarning: "No fields assigned — assign each field to a step below, or the export drops the steps.",
    addStep: "Add step",
    reviewLabel: "Review step (summary of earlier steps; owns no fields)",
    /** e.g. "Step 1 title". */
    titleAriaLabel: "Step {n} title",
    /** e.g. "Move step 1 up". */
    moveUpAriaLabel: "Move step {n} up",
    /** e.g. "Move step 1 down". */
    moveDownAriaLabel: "Move step {n} down",
    /** e.g. "Remove step 1". */
    removeAriaLabel: "Remove step {n}",
    /** e.g. "Step 1 review step". */
    reviewAriaLabel: "Step {n} review step",
  },

  props: {
    heading: "Properties",
    selectPrompt: "Select a field to edit its properties.",
    deleteFieldAriaLabel: "Delete field",
    /**
     * Descriptor-table copy from model/fieldProps.ts, keyed by the
     * descriptor's `key` (stable). Most keys have a single label/help pair
     * shared by every field type that uses them. Where the SAME propKey
     * renders a different label depending on field-type context — "min"/
     * "max" on number/slider vs. rating's "Max stars" vs. group's "Min/Max
     * rows" — a variant sub-key disambiguates. "options" keeps one label
     * ("Options") but three help variants (none / checkbox / switch), so
     * only its help is split by variant.
     */
    fields: {
      name: { label: "Name", help: "Unique key in the submitted values. No dots." },
      label: { label: "Label" },
      description: { label: "Description" },
      placeholder: { label: "Placeholder" },
      required: { label: "Required" },
      disabled: { label: "Disabled" },
      width: { label: "Width" },
      visibleWhen: { label: "Visible when" },
      disabledWhen: { label: "Disabled when" },
      enabledWhen: {
        label: "Enabled when",
        help: "Disabled until the conditions match — e.g. until other fields are valid.",
      },
      enabledWhenVerified: {
        label: "Enabled when verified",
        help: "Stays disabled until the named OTP field is verified.",
      },
      copyFrom: {
        label: "Copy from",
        help: "Mirrors the named field until this one is edited; the source wins again on its next change.",
      },
      rules: { label: "Validation rules" },
      complexity: { label: "Password complexity" },
      mask: { label: "Mask", help: "# digit, A letter, * alphanumeric; other chars are literals." },
      message: { label: "Error message" },
      min: {
        label: "Min",
        rows: { label: "Min rows" },
      },
      max: {
        label: "Max",
        rows: { label: "Max rows" },
        stars: { label: "Max stars", help: "2–10, defaults to 5." },
      },
      step: { label: "Step" },
      length: { label: "Length", help: "Number of code digits." },
      dependsOn: { label: "Depends on", help: "Field that must be valid before sending a code." },
      defaultCountry: { label: "Default country" },
      preferredCountries: { label: "Preferred countries" },
      countryFrom: { label: "Sync country from" },
      options: {
        label: "Options",
        help: {
          checkbox: "Add options to make it a checkbox group; leave empty for a single checkbox.",
          switch: "Add options for a multi-switch; leave empty for a single switch.",
        },
      },
      optionsFrom: {
        label: "Options from field",
        help: "Options depend on another field's value — one option list per source value.",
      },
      searchable: { label: "Searchable" },
      multiple: { label: "Multiple" },
      countries: { label: "Countries (subset)" },
      range: { label: "Range" },
      minDate: { label: "Min date" },
      maxDate: { label: "Max date" },
      minDateField: {
        label: "Not before field",
        help: "Must be on or after the named date field's value. Not available on range fields.",
      },
      maxDateField: { label: "Not after field", help: "Must be on or before the named date field's value." },
      minTime: { label: "Min time" },
      maxTime: { label: "Max time" },
      stepMinutes: { label: "Step (minutes)" },
      minTimeField: { label: "Not before field", help: "Must be at or after the named time field's value." },
      maxTimeField: { label: "Not after field", help: "Must be at or before the named time field's value." },
      penColor: { label: "Pen color" },
      heightPx: { label: "Height (px)" },
      accept: { label: "Accept", help: 'e.g. ".pdf,.png,.jpg"' },
      maxSizeMB: { label: "Max size (MB)" },
      value: { label: "Value", help: "Any JSON value; submitted as-is." },
      content: {
        label: "Content",
        help: 'Plain text; an inline <a href="…">link</a> and <br> are rendered (safe URLs only).',
      },
      as: {
        label: "Render as",
        options: {
          h1: "Heading 1",
          h2: "Heading 2",
          p: "Paragraph",
          divider: "Divider",
        },
      },
      text: { label: "Button text" },
      variant: { label: "Variant" },
    },
  },

  controls: {
    condition: {
      noSiblingFields: "No sibling fields to reference",
      addCondition: "Add condition",
      or: "or",
      and: "and",
      fieldAriaLabel: "Condition field",
      fieldPlaceholder: "Field",
      removeAriaLabel: "Remove condition",
      operatorAriaLabel: "Condition operator",
      ops: {
        equals: "equals",
        notEquals: "not equals",
        in: "in (list)",
        isValid: "is valid",
        isInvalid: "is invalid",
      },
      valueAriaLabel: "Condition value",
      inPlaceholder: "a, b, c",
      valuePlaceholder: "value",
      addAndAriaLabel: "Add AND condition",
      addAndText: "And",
      addOrAriaLabel: "Add OR group",
      addOrText: "Or",
    },

    rules: {
      minLength: "Min length",
      maxLength: "Max length",
      pattern: "Pattern (regex)",
      patternMessage: "Pattern message",
      allow: "Allow (char class)",
      allowPlaceholder: "A-Za-z ",
      matchField: "Must match field",
      none: "None",
      matchMessage: "Match message",
      trim: "Trim before validating",
    },

    options: {
      labelAriaLabel: "Option {n} label",
      labelPlaceholder: "Label",
      valueAriaLabel: "Option {n} value",
      valuePlaceholder: "value",
      disabled: "Disabled",
      moveUpAriaLabel: "Move option {n} up",
      moveDownAriaLabel: "Move option {n} down",
      removeAriaLabel: "Remove option {n}",
      addOption: "Add option",
    },

    optionsFrom: {
      noEligibleSources: "No eligible source fields",
      addMapping: "Add options mapping",
      sourceFieldAriaLabel: "Options source field",
      sourceFieldPlaceholder: "Source field",
      removeMappingAriaLabel: "Remove options mapping",
      branchValueAriaLabel: "Branch {n} source value",
      branchValuePlaceholder: "source value",
      removeBranchAriaLabel: "Remove branch {n}",
      duplicateWarning: "Duplicate source value — this branch is ignored until renamed.",
      addBranchAriaLabel: "Add value branch",
      addBranchText: "Value branch",
    },

    complexity: {
      uppercase: "Uppercase",
      lowercase: "Lowercase",
      number: "Number",
      specialChar: "Special char",
      minLength: "Min length",
    },

    width: {
      uniform: "Uniform",
      perBreakpoint: "Per breakpoint",
      modeAriaLabel: "Width mode",
      mobile: "Mobile",
      tablet: "Tablet",
      desktop: "Desktop",
      widthLabel: "Width",
      selectPlaceholder: "full",
      fullDefault: "full (default)",
    },

    country: {
      searchPlaceholder: "Search country…",
      noResults: "No country found.",
      selectCountry: "Select country",
      clear: "Clear",
      /** e.g. "3 selected". */
      selectedCount: "{n} selected",
      addCountries: "Add countries",
    },

    primitives: {
      selectDefault: "Default",
      fieldRefNone: "None",
      penColorAriaLabel: "Pen color",
      penColorPlaceholder: "#000000",
      jsonPlaceholder: '"text", 42, true, or {"a":1}',
    },
  },
} as const;
