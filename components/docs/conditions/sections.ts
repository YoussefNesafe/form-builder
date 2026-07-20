import type { TocItem } from "@/components/docs/DocsToc";
import { VisibleDisabledEnabledWhenSection } from "./VisibleDisabledEnabledWhenSection";
import { ConditionShapeSection } from "./ConditionShapeSection";
import { IsValidOperatorSection } from "./IsValidOperatorSection";
import { GroupLimitationSection } from "./GroupLimitationSection";
import { TryItSection } from "./TryItSection";

export const SECTIONS: { id: string; title: string; Section: React.ComponentType }[] = [
  VisibleDisabledEnabledWhenSection,
  ConditionShapeSection,
  IsValidOperatorSection,
  GroupLimitationSection,
  TryItSection,
];

export const TOC_ITEMS: TocItem[] = SECTIONS.map(({ id, title }) => ({ id, title }));
