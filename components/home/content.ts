import { GitBranch, KeyRound, Layers, ListChecks, Save, ShieldCheck, type LucideIcon } from "lucide-react";
import { advancedFieldsConfig } from "@/app/(site)/examples/advanced-fields/config";
import { conditionalProfileConfig } from "@/app/(site)/examples/conditional-profile/config";
import type { FormConfig } from "@/form-builder";
import { landingDemoConfig } from "./demoConfig";

// Structural data only — icon refs, hrefs, mono spec-sheet keys, and which
// real config the showcase card code peeks are generated from. All
// user-visible copy lives in locales/en/home.ts; these arrays carry the
// slugs used to look that copy up.

export const CAPABILITY_ROWS = [
  { slug: "fieldTypes", icon: ListChecks, monoKey: "fields:" },
  { slug: "conditionalLogic", icon: GitBranch, monoKey: "visibleWhen:" },
  { slug: "wizards", icon: Layers, monoKey: "steps:" },
  // Cross-field rules live in the form-level superRefine, never a field's own
  // schema (see AGENTS.md) — the mono key names that real mechanism.
  { slug: "crossFieldValidation", icon: ShieldCheck, monoKey: "superRefine:" },
  { slug: "otp", icon: KeyRound, monoKey: "otp:" },
  { slug: "autosave", icon: Save, monoKey: "autosave:" },
] as const satisfies ReadonlyArray<{ slug: string; icon: LucideIcon; monoKey: string }>;

export const COMPARISON_ROW_SLUGS = [
  "ownCode",
  "typeSafeValidation",
  "conditionalLogic",
  "customFieldTypes",
  "offlineNoLockIn",
  "pricing",
] as const;

// Showcase card grid (§2 of the redesign) — the multi-step-signup card moved
// to the flagship split (§3); these three keep linking to their real routes.
// Each card's code peek is generated from the field named in
// `peekFieldNames`, pulled off the actual imported config (see
// components/home/fieldPeek.ts) — never a hand-typed snippet.
export const SHOWCASE_CARDS = [
  {
    slug: "conditionalProfile",
    href: "/examples/conditional-profile",
    config: conditionalProfileConfig,
    peekFieldNames: ["companyName", "billingCycle", "phone"],
  },
  {
    slug: "advancedFields",
    href: "/examples/advanced-fields",
    config: advancedFieldsConfig,
    peekFieldNames: ["cardNumber", "endDate", "signature"],
  },
  {
    slug: "builder",
    href: "/builder",
    // No single config backs the /builder route itself (the canvas starts
    // empty) — this reuses the hero's own live config, which is a real,
    // currently-rendered FormConfig, not a fabricated one.
    config: landingDemoConfig,
    peekFieldNames: ["accountType", "companyName", "email"],
  },
] as const satisfies ReadonlyArray<{
  slug: string;
  href: string;
  config: FormConfig;
  peekFieldNames: readonly string[];
}>;
