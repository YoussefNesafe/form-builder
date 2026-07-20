import { GitBranch, KeyRound, Layers, ListChecks, Save, ShieldCheck, type LucideIcon } from "lucide-react";
import { advancedFieldsConfig } from "@/app/(site)/examples/advanced-fields/config";
import { conditionalProfileConfig } from "@/app/(site)/examples/conditional-profile/config";
import type { FormConfig } from "@/form-builder";
import { landingDemoConfig } from "./demoConfig";

export const CAPABILITY_ROWS = [
  { slug: "fieldTypes", icon: ListChecks, monoKey: "fields:" },
  { slug: "conditionalLogic", icon: GitBranch, monoKey: "visibleWhen:" },
  { slug: "wizards", icon: Layers, monoKey: "steps:" },
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
    config: landingDemoConfig,
    peekFieldNames: ["accountType", "companyName", "email"],
  },
] as const satisfies ReadonlyArray<{
  slug: string;
  href: string;
  config: FormConfig;
  peekFieldNames: readonly string[];
}>;
