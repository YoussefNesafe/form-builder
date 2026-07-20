import type { TocItem } from "@/components/docs/DocsToc";
import { StepConfigShapeSection } from "./StepConfigShapeSection";
import { StepGatingSection } from "./StepGatingSection";
import { ConditionalStepsSection } from "./ConditionalStepsSection";
import { ReviewStepSection } from "./ReviewStepSection";
import { OtpDependsOnSection } from "./OtpDependsOnSection";
import { TryItSection } from "./TryItSection";

export const SECTIONS: { id: string; title: string; Section: React.ComponentType }[] = [
  StepConfigShapeSection,
  StepGatingSection,
  ConditionalStepsSection,
  ReviewStepSection,
  OtpDependsOnSection,
  TryItSection,
];

export const TOC_ITEMS: TocItem[] = SECTIONS.map(({ id, title }) => ({ id, title }));
