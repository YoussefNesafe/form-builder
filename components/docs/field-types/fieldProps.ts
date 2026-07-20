import { BUILT_IN_FIELD_TYPES } from "@/form-builder";
import type { BaseField, FieldConfig, FieldType } from "@/form-builder";

type VariantFor<T extends FieldType> =
  FieldConfig extends infer U ? (U extends { type: infer TT } ? (T extends TT ? U : never) : never) : never;

type OwnProps<T extends FieldType> = Exclude<keyof VariantFor<T>, keyof BaseField | "type">;

export type PropDoc = {
  type: string;
  required: boolean;
  description: string;
};

export const FIELD_PROP_DOCS: { [T in FieldType]: Record<OwnProps<T>, PropDoc> } = {
  text: {
    rules: {
      type: "TextRules",
      required: false,
      description: "Length/pattern/trim/allow/matches constraints — see the shared TextRules shape below.",
    },
  },
  email: {
    rules: {
      type: "TextRules",
      required: false,
      description:
        "Same TextRules shape as text — the email-format check itself is built in, not part of rules.",
    },
  },
  password: {
    rules: {
      type: "TextRules",
      required: false,
      description: "Same TextRules shape as text/email — length/pattern/trim/allow/matches, layered on top of complexity.",
    },
    complexity: {
      type: "PasswordComplexity",
      required: false,
      description:
        "Adds a live pass/fail checklist (uppercase/lowercase/number/special/minLength) under the input while typing; only the currently-failing rules render, and the checklist replaces (never duplicates) the schema's error text.",
    },
  },
  textarea: {
    rules: {
      type: "TextRules",
      required: false,
      description: "Same TextRules shape as text — see the shared TextRules shape below.",
    },
  },
  masked: {
    mask: {
      type: "string",
      required: true,
      description:
        "Pattern made of '#' (digit), 'A' (letter), '*' (alphanumeric) token chars — every other character is a literal; must contain at least one token char (validator-enforced).",
    },
    message: {
      type: "string",
      required: false,
      description: 'Custom error for an incomplete value; defaults to the "Incomplete value" message.',
    },
  },
  number: {
    min: { type: "number", required: false, description: "Native min constraint." },
    max: { type: "number", required: false, description: "Native max constraint." },
    step: { type: "number", required: false, description: "Native step constraint (also the spinner increment)." },
  },
  otp: {
    length: {
      type: "number",
      required: true,
      description: "Number of code digits/characters rendered as input-otp slots.",
    },
    dependsOn: {
      type: "string",
      required: false,
      description:
        "Sibling field whose value gates this code: changing it invalidates any already-verified code (generation-stamped) and resets the send/verify flow. Rejected inside groups.",
    },
  },
  phone: {
    defaultCountry: {
      type: "string (ISO alpha-2)",
      required: false,
      description: "Initial calling code shown before the user picks or types a number.",
    },
    preferredCountries: {
      type: "string[] (ISO alpha-2)",
      required: false,
      description: "Pins these countries, in this order, above the rest (which stay name-sorted) in the flag dropdown.",
    },
    countryFrom: {
      type: "string",
      required: false,
      description:
        "Sibling country or single-value select field this phone re-syncs its calling code from on every change — see the shared countryFrom shape below.",
    },
  },
  select: {
    options: {
      type: "Option[]",
      required: false,
      description:
        "Static option list. Exactly one of options or optionsFrom is required — set neither or both and validateFormConfig throws.",
    },
    optionsFrom: {
      type: "{ field: string; map: Record<string, Option[]> }",
      required: false,
      description:
        "Derives the option list from a sibling field's current value instead of a static array — see the shared optionsFrom shape below.",
    },
    searchable: {
      type: "boolean",
      required: false,
      description: "Renders a filterable combobox instead of the native <select>.",
    },
    multiple: {
      type: "boolean",
      required: false,
      description:
        "Value becomes Option[\"value\"][] instead of a single value; also switches rendering to the combobox (like searchable).",
    },
  },
  country: {
    countries: {
      type: "string[] (ISO alpha-2)",
      required: false,
      description:
        "Restricts the combobox to this subset; defaults to every ISO 3166-1 alpha-2 country (libphonenumber-js getCountries()).",
    },
    preferredCountries: {
      type: "string[] (ISO alpha-2)",
      required: false,
      description: "Pins these countries, in this order, above the rest; must be a subset of countries when both are set (validator-enforced).",
    },
  },
  radio: {
    options: {
      type: "Option[]",
      required: true,
      description: "Choices rendered as a radix RadioGroup; at least one option is required (validator-enforced).",
    },
  },
  segmented: {
    options: {
      type: "Option[]",
      required: true,
      description:
        "Choices rendered as a joined button group with radio semantics (radix RadioGroup, not a toggle group) — guaranteed radiogroup/radio roles and arrow-key roving focus; at least one option is required.",
    },
  },
  checkbox: {
    options: {
      type: "Option[]",
      required: false,
      description:
        'Presence of options renders a checkbox GROUP (value becomes Option["value"][] of the checked entries); omit it for a single boolean checkbox.',
    },
  },
  switch: {
    options: {
      type: "Option[]",
      required: false,
      description:
        "Inherited from the shared checkbox/switch config shape but NOT functionally supported on switch (known issue) — a switch always renders and stores a single boolean regardless of options; use checkbox for a group.",
    },
  },
  date: {
    range: {
      type: "boolean",
      required: false,
      description: 'Renders a range calendar and switches the value to { from?; to? } instead of a single "yyyy-MM-dd" string.',
    },
    minDate: {
      type: '"yyyy-MM-dd"',
      required: false,
      description: "Earliest selectable date; also biases the calendar's initial month.",
    },
    maxDate: {
      type: '"yyyy-MM-dd"',
      required: false,
      description: "Latest selectable date; also biases the calendar's initial month.",
    },
    minDateField: {
      type: "string",
      required: false,
      description:
        "Bounds this date to be on/after a sibling non-range date field's current value (form-level refine, not this field's own schema); rejected together with range: true (validator-enforced).",
    },
    maxDateField: {
      type: "string",
      required: false,
      description:
        "Bounds this date to be on/before a sibling non-range date field's current value; same range: true restriction as minDateField.",
    },
  },
  time: {
    minTime: {
      type: '"HH:mm"',
      required: false,
      description: "Earliest selectable time — zero-padded 24h, compared lexicographically.",
    },
    maxTime: {
      type: '"HH:mm"',
      required: false,
      description: "Latest selectable time; must not be before minTime (validator-enforced).",
    },
    stepMinutes: {
      type: "number",
      required: false,
      description: "Minute increment; converted to seconds for the native input's step attribute.",
    },
    minTimeField: {
      type: "string",
      required: false,
      description: "Bounds this time to be on/after a sibling time field's current value (form-level refine).",
    },
    maxTimeField: {
      type: "string",
      required: false,
      description: "Bounds this time to be on/before a sibling time field's current value (form-level refine).",
    },
  },
  rating: {
    max: {
      type: "number",
      required: false,
      description: "Highest star value (1..max); defaults to 5 when unset. Must be between 2 and 10 (validator-enforced).",
    },
  },
  slider: {
    min: { type: "number", required: true, description: "Lower bound of the range." },
    max: { type: "number", required: true, description: "Upper bound of the range." },
    step: { type: "number", required: false, description: "Increment between selectable values." },
  },
  signature: {
    penColor: {
      type: "string (CSS color)",
      required: false,
      description:
        "Ink color; defaults to signature_pad's own default (black). Treated as static config — changing it at runtime recreates the pad and only restores the value captured at mount.",
    },
    heightPx: {
      type: "number",
      required: false,
      description: "Canvas height in pixels; defaults to 160.",
    },
  },
  file: {
    accept: {
      type: "string",
      required: false,
      description: 'Native accept attribute (MIME types / extensions), e.g. ".pdf,.doc,.docx".',
    },
    maxSizeMB: {
      type: "number",
      required: false,
      description:
        "Rejects files larger than this via the generated schema (a field error, not a manual setError, so it survives the next resolver run); unset means no size limit.",
    },
    multiple: {
      type: "boolean",
      required: false,
      description: "Value becomes File[] instead of a single File; also allows picking more than one file at once.",
    },
  },
  hidden: {
    value: {
      type: "unknown",
      required: true,
      description:
        "The static value carried through with the rest of the form's values; must not appear in a step's fieldNames (validator-enforced — it's exempt from step assignment).",
    },
  },
  static: {
    content: {
      type: "string",
      required: true,
      description:
        "The block's text; may contain an allowlisted inline <a href> or <br> (safe schemes only) via the field's rich-text renderer.",
    },
    as: {
      type: '"h1" | "h2" | "p" | "divider"',
      required: false,
      description: 'Element to render as; omit for a plain paragraph. "divider" ignores content and renders a separator instead.',
    },
  },
  group: {
    fields: {
      type: "AnyFieldConfig[]",
      required: true,
      description:
        "Recursive — any field type documented on this page (not expanded here to avoid infinite recursion in this table). Known v1 limitation: visibleWhen/disabledWhen conditions on fields nested inside a group are NOT skipped by validation.",
    },
    min: {
      type: "number",
      required: false,
      description: "Minimum rows; defaults to 0. The remove button disables once row count reaches this floor.",
    },
    max: {
      type: "number",
      required: false,
      description: "Maximum rows; defaults to unbounded. The add button disables once row count reaches this ceiling.",
    },
  },
  submit: {
    text: { type: "string", required: true, description: "Button label." },
    variant: {
      type: "ButtonVariant",
      required: false,
      description: '\'default\' | \'destructive\' | \'outline\' | \'secondary\' | \'ghost\' | \'link\' (shadcn Button variant).',
    },
  },
};

export type FieldValueInfo<T extends FieldType = FieldType> = {
  valueShape: string;
  example: VariantFor<T>;
};

export const FIELD_VALUE_INFO: { [T in FieldType]: FieldValueInfo<T> } = {
  text: {
    valueShape: "string",
    example: { type: "text", name: "fullName", label: "Full name", required: true },
  },
  email: {
    valueShape: "string (email-format checked on submit, not blocked while typing)",
    example: { type: "email", name: "email", label: "Email address", required: true },
  },
  password: {
    valueShape: "string",
    example: {
      type: "password",
      name: "password",
      label: "Password",
      required: true,
      complexity: { minLength: 8, number: true },
    },
  },
  textarea: {
    valueShape: "string",
    example: { type: "textarea", name: "bio", label: "Bio", rules: { maxLength: 500 } },
  },
  masked: {
    valueShape:
      'string — RAW token characters only (e.g. "4111111111111111"), never the punctuated display string',
    example: { type: "masked", name: "ssn", label: "SSN", mask: "###-##-####" },
  },
  number: {
    valueShape: "number, or undefined once the input is blank/invalid",
    example: { type: "number", name: "age", label: "Age", min: 0, max: 120, step: 1 },
  },
  otp: {
    valueShape:
      "string of exactly length characters; submit gating reads the separate verified-code registry, not this string alone",
    example: { type: "otp", name: "emailOtp", label: "Verification code", length: 6, dependsOn: "email" },
  },
  phone: {
    valueShape: 'string — international phone string (e.g. "+15551234567"), or ""',
    example: {
      type: "phone",
      name: "phone",
      label: "Phone number",
      defaultCountry: "US",
      preferredCountries: ["US", "CA", "GB"],
      countryFrom: "country",
    },
  },
  select: {
    valueShape:
      'single (default): the matching Option["value"] (string | number), or undefined. multiple: true → Option["value"][]',
    example: {
      type: "select",
      name: "role",
      label: "Role",
      options: [
        { label: "Admin", value: "admin" },
        { label: "Member", value: "member" },
      ],
    },
  },
  country: {
    valueShape: 'string — ISO 3166-1 alpha-2 code (e.g. "AE"), or undefined',
    example: { type: "country", name: "country", label: "Country", preferredCountries: ["US", "CA", "GB"] },
  },
  radio: {
    valueShape: 'the matching Option["value"]',
    example: {
      type: "radio",
      name: "plan",
      label: "Plan",
      options: [
        { label: "Monthly", value: "monthly" },
        { label: "Yearly", value: "yearly" },
      ],
    },
  },
  segmented: {
    valueShape: 'the matching Option["value"] (radio semantics — same as radio)',
    example: {
      type: "segmented",
      name: "size",
      label: "Size",
      options: [
        { label: "S", value: "s" },
        { label: "M", value: "m" },
        { label: "L", value: "l" },
      ],
    },
  },
  checkbox: {
    valueShape:
      'no options (default): boolean. options set → Option["value"][] of the checked entries',
    example: { type: "checkbox", name: "acceptTerms", label: "I accept the terms", required: true },
  },
  switch: {
    valueShape: "boolean — always a single toggle; options has no effect",
    example: { type: "switch", name: "marketingOptIn", label: "Send me updates" },
  },
  date: {
    valueShape:
      'single (default): "yyyy-MM-dd" string, or undefined. range: true → { from?: "yyyy-MM-dd"; to?: "yyyy-MM-dd" } (from may be set alone mid-selection)',
    example: { type: "date", name: "birthDate", label: "Date of birth", maxDate: "2026-07-12" },
  },
  time: {
    valueShape: 'zero-padded "HH:mm" string, or ""',
    example: {
      type: "time",
      name: "appointmentTime",
      label: "Appointment time",
      minTime: "09:00",
      maxTime: "17:00",
      stepMinutes: 15,
    },
  },
  rating: {
    valueShape: "number 1..max, or undefined (clicking the current value clears it when the field is optional)",
    example: { type: "rating", name: "satisfaction", label: "How satisfied are you?", max: 5 },
  },
  slider: {
    valueShape: "number",
    example: { type: "slider", name: "volume", label: "Volume", min: 0, max: 100, step: 5 },
  },
  signature: {
    valueShape: 'PNG data URL string, or "" until the user signs',
    example: { type: "signature", name: "signature", label: "Signature", heightPx: 180 },
  },
  file: {
    valueShape:
      "single (default): a File, or undefined — not JSON-serializable, consumers handle upload in onSubmit. multiple: true → File[]",
    example: { type: "file", name: "resume", label: "Resume", accept: ".pdf,.doc,.docx", maxSizeMB: 5 },
  },
  hidden: {
    valueShape: "config.value verbatim (unknown) — carried through untouched",
    example: { type: "hidden", name: "referralSource", value: "landing-page" },
  },
  static: {
    valueShape: "no value — not a form field; renders content only",
    example: { type: "static", name: "sectionIntro", as: "h2", content: "Contact details" },
  },
  group: {
    valueShape: "an array of row objects, one per repetition, each shaped by fields (bounded by min/max)",
    example: {
      type: "group",
      name: "teamMembers",
      label: "Team members",
      min: 1,
      max: 5,
      fields: [{ type: "text", name: "name", label: "Name", required: true }],
    },
  },
  submit: {
    valueShape: "no value — renders a submit button",
    example: { type: "submit", name: "submit", text: "Create account", variant: "default" },
  },
};

export const FIELD_TYPE_ORDER: readonly FieldType[] = BUILT_IN_FIELD_TYPES;

export type BasePropDoc = PropDoc & {
  name: keyof BaseField;
  exceptions?: string;
};

export const BASE_FIELD_PROPS: BasePropDoc[] = [
  {
    name: "name",
    type: "string",
    required: true,
    description:
      "Field key: the RHF register name, and the identifier that conditions, copyFrom/countryFrom/optionsFrom, and dependsOn target by name. Must not contain a dot (validator-enforced — dots are read as nested paths by RHF and the condition engine).",
  },
  {
    name: "label",
    type: "string",
    required: false,
    description: "Visible label text.",
    exceptions: "static and submit ignore it (their own content/text prop is the visible text instead).",
  },
  {
    name: "description",
    type: "string",
    required: false,
    description: "Helper text rendered under the label and wired into aria-describedby alongside any error.",
  },
  {
    name: "placeholder",
    type: "string",
    required: false,
    description: "Placeholder/prompt text; meaning is per-control (input placeholder, empty-select prompt, unset-date prompt).",
    exceptions:
      "on group it overrides the \"Add\" button's label instead of a text placeholder; has no effect on radio, segmented, checkbox group, rating, slider, or signature.",
  },
  {
    name: "required",
    type: "boolean",
    required: false,
    description: "Marks the field mandatory: shows a required mark and drives the generated zod schema.",
    exceptions:
      "on rating it also changes clear behavior (clicking the current value clears it only when optional); radio, segmented, and country can never be cleared once set, regardless of required. No effect on static/submit (no user input) or hidden (always has a value).",
  },
  {
    name: "disabled",
    type: "boolean",
    required: false,
    description: "Statically disables the control; disabledWhen/enabledWhen layer on top of (not instead of) this flag.",
  },
  {
    name: "visibleWhen",
    type: "ConditionSpec",
    required: false,
    description:
      "Hides the field and excludes it from validation and the submit payload while the spec doesn't match. Value operators only (equals/notEquals/in) — isValid is rejected here, since visibility itself decides which schema gets built.",
  },
  {
    name: "disabledWhen",
    type: "ConditionSpec",
    required: false,
    description:
      "Disables the field while the spec matches. The only base prop where isValid is allowed (checking a sibling's own schema validity). Mutually exclusive with enabledWhen (validator-enforced).",
  },
  {
    name: "enabledWhen",
    type: "ConditionSpec",
    required: false,
    description:
      "Inverse of disabledWhen — disabled while the spec does NOT match; reads straight for \"enabled once X is valid\". Mutually exclusive with disabledWhen.",
  },
  {
    name: "enabledWhenVerified",
    type: "string",
    required: false,
    description: "Keeps the field disabled until the named sibling otp field's code is verified.",
    exceptions: "must reference a sibling of type otp; rejected inside a group (validator-enforced).",
  },
  {
    name: "copyFrom",
    type: "string",
    required: false,
    description:
      "Mirrors a same-type sibling's value until the user edits this field, then the source wins again on its next change (same semantics as phone's countryFrom).",
    exceptions:
      "not supported on phone, otp, password, file, signature, group, hidden, static, or submit fields (validator-enforced); a select pair must also match multiple, and a date pair must also match range.",
  },
  {
    name: "width",
    type: "ResponsiveFieldWidth",
    required: false,
    description:
      '\'full\' | \'half\' | \'third\' | \'quarter\', or a per-breakpoint object, on the 12-col grid; unset breakpoints fall back to full rather than cascading from a smaller breakpoint.',
  },
];

export type SharedShapeDoc = {
  name: string;
  type: string;
  description: string;
  usedBy: FieldType[];
};

export const SHARED_SHAPES: SharedShapeDoc[] = [
  {
    name: "Option",
    type: "{ label: string; value: string | number; disabled?: boolean }",
    description:
      "One selectable choice. radio/segmented/checkbox compare value with ===; the native <select> compares String(value), so numeric and string values that stringify the same are not distinguished there. disabled greys out just that option.",
    usedBy: ["select", "radio", "segmented", "checkbox", "switch"],
  },
  {
    name: "TextRules",
    type: "{ minLength?; maxLength?; pattern?: string; message?; trim?; allow?: string; matches?: string; matchesMessage? }",
    description:
      "pattern is a string (not a RegExp) so it stays JSON-serializable; trim also normalizes the visible input on blur, not just the parsed payload; allow blocks disallowed characters at typing/paste time (a character-class body, e.g. \"A-Za-z \"). matches is cross-field equality (confirm password/email): enforced by a form-level refine, never the field's own schema — the isValid oracle behind isValid conditions parses field schemas in isolation and can't see it.",
    usedBy: ["text", "email", "textarea", "password"],
  },
  {
    name: "PasswordComplexity",
    type: "{ uppercase?; lowercase?; number?; special?: boolean; minLength?: number }",
    description:
      "Each flag adds one line to the live pass/fail checklist rendered under the password input; minLength adds its own line instead of folding into rules.minLength.",
    usedBy: ["password"],
  },
  {
    name: "optionsFrom",
    type: "{ field: string; map: Record<string, Option[]> }",
    description:
      "field must be a sibling single-value select or country field (validator-enforced — a multi-select or a dynamic optionsFrom source is rejected); map is keyed by String(source value). A source value with no matching key renders an empty, disabled select (dev-only console warning, not a hard error). Not supported inside groups.",
    usedBy: ["select"],
  },
  {
    name: "countryFrom",
    type: "string",
    description:
      "Names a sibling country or single-value select field (whose option values are ISO alpha-2 — a country field qualifies by construction, a select's options are validated as ISO codes). The phone field re-syncs its calling code from that source on every change — the source always wins over a manual pick, until the source changes again. Rejected inside groups; a cross-step pairing only dev-warns (source edits made while the phone field is unmounted are skipped until it remounts).",
    usedBy: ["phone"],
  },
  {
    name: "Sibling-bound min/max (date & time)",
    type: "minDateField/maxDateField (date), minTimeField/maxTimeField (time): string",
    description:
      "Bounds a field against a sibling date/time field's CURRENT value (e.g. \"end date on/after start date\") via a form-level superRefine — never the field's own schema, so the isValid oracle (which parses fields in isolation) can't see it. minDateField/maxDateField are rejected together with range: true on the date field itself (validator-enforced); the time equivalents have no such restriction.",
    usedBy: ["date", "time"],
  },
];
