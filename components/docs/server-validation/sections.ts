import type { TocItem } from "@/components/docs/DocsToc";
import { SignatureSection } from "./SignatureSection";
import { QuickStartSection } from "./QuickStartSection";
import { FrameworkRecipesSection } from "./FrameworkRecipesSection";
import { OtpSection } from "./OtpSection";
import { FileUploadsSection } from "./FileUploadsSection";
import { CustomFieldTypesSection } from "./CustomFieldTypesSection";
import { TrustedValuesSection } from "./TrustedValuesSection";
import { ConditionsSection } from "./ConditionsSection";
import { LimitsAndScopeSection } from "./LimitsAndScopeSection";

export const SECTIONS: { id: string; title: string; Section: React.ComponentType }[] = [
  SignatureSection,
  QuickStartSection,
  FrameworkRecipesSection,
  OtpSection,
  FileUploadsSection,
  CustomFieldTypesSection,
  TrustedValuesSection,
  ConditionsSection,
  LimitsAndScopeSection,
];

export const TOC_ITEMS: TocItem[] = SECTIONS.map(({ id, title }) => ({ id, title }));
