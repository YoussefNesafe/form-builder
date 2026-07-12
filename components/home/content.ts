import { GitBranch, KeyRound, Layers, ListChecks, Save, ShieldCheck, type LucideIcon } from "lucide-react";

// Structural data only — icon refs, hrefs, decorative widths, and the code
// snippet. All user-visible copy lives in locales/en/home.ts; these arrays
// carry the slugs used to look that copy up.

export const FEATURE_SLUGS = [
  { slug: "fieldTypes", icon: ListChecks },
  { slug: "conditionalLogic", icon: GitBranch },
  { slug: "wizards", icon: Layers },
  { slug: "crossFieldValidation", icon: ShieldCheck },
  { slug: "otp", icon: KeyRound },
  { slug: "autosave", icon: Save },
] as const satisfies ReadonlyArray<{ slug: string; icon: LucideIcon }>;

export const COMPARISON_ROW_SLUGS = ["ownCode", "typeSafeValidation", "conditionalLogic"] as const;

// Showcase-style card grid (§4 of the visual spec) — our answer to
// nextjs.org/showcase's site grid, mapped onto real routes. Card copy in
// locales/en/home.ts's showcase.cards duplicates examples-page descriptions
// verbatim for multiStepSignup/conditionalProfile/advancedFields (and the
// hero's own copy for "builder") — intentional, not new marketing copy.
// Slice 3 owns the examples-page side; the two aren't cross-referenced yet.
export const SHOWCASE_CARDS = [
  { slug: "multiStepSignup", href: "/examples/multi-step-signup", preview: "fields" },
  { slug: "conditionalProfile", href: "/examples/conditional-profile", preview: "fields" },
  { slug: "advancedFields", href: "/examples/advanced-fields", preview: "fields" },
  { slug: "builder", href: "/builder", preview: "chips" },
] as const satisfies ReadonlyArray<{ slug: string; href: string; preview: "fields" | "chips" }>;

// Fixed set of skeleton "field row" widths for the example cards' preview
// placeholder — purely decorative (aria-hidden), so any 3 widths do.
export const FIELD_ROW_WIDTHS = [
  "w-[85%] tablet:w-[85%] desktop:w-[85%]",
  "w-[60%] tablet:w-[60%] desktop:w-[60%]",
  "w-[72%] tablet:w-[72%] desktop:w-[72%]",
] as const;

export const CODE_SNIPPET = `import { FormRenderer, registerBuiltInFields } from "@/form-builder";
import type { FormConfig } from "@/form-builder";

registerBuiltInFields();

const config: FormConfig = {
  id: "signup",
  fields: [
    { type: "email", name: "email", label: "Email", required: true },
    { type: "password", name: "password", label: "Password", required: true },
    { type: "country", name: "country", label: "Country" },
    { type: "submit", name: "submit", text: "Create account" },
  ],
};

export function SignupForm() {
  return <FormRenderer config={config} onSubmit={(values) => console.log(values)} />;
}`;
