import type { TocItem } from "@/components/docs/DocsToc";
import { VisibleDisabledEnabledWhenSection } from "./VisibleDisabledEnabledWhenSection";
import { ConditionShapeSection } from "./ConditionShapeSection";
import { IsValidOperatorSection } from "./IsValidOperatorSection";
import { GroupLimitationSection } from "./GroupLimitationSection";
import { TryItSection } from "./TryItSection";

// Ordered registry — single source for both page composition and the TOC.
// Each entry's `id` is the same binding the section passes to its own
// <DocsSection id>, so the TOC anchor can never drift from the heading it
// points at (see components/docs/sections.test.tsx for the guarantee).
export const SECTIONS: { id: string; title: string; Section: React.ComponentType }[] = [
  VisibleDisabledEnabledWhenSection,
  ConditionShapeSection,
  IsValidOperatorSection,
  GroupLimitationSection,
  TryItSection,
];

export const TOC_ITEMS: TocItem[] = SECTIONS.map(({ id, title }) => ({ id, title }));
