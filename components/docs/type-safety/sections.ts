import type { TocItem } from "@/components/docs/DocsToc";
import { DefineFormSection } from "./DefineFormSection";
import { ValueTypeMappingSection } from "./ValueTypeMappingSection";
import { ConditionalOptionalitySection } from "./ConditionalOptionalitySection";
import { CustomTypesSection } from "./CustomTypesSection";
import { StepLevelGapSection } from "./StepLevelGapSection";

export const SECTIONS: { id: string; title: string; Section: React.ComponentType }[] = [
  DefineFormSection,
  ValueTypeMappingSection,
  ConditionalOptionalitySection,
  CustomTypesSection,
  StepLevelGapSection,
];

export const TOC_ITEMS: TocItem[] = SECTIONS.map(({ id, title }) => ({ id, title }));
