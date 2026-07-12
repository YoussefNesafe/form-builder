import type { TocItem } from "@/components/docs/DocsToc";
import { BasePropsSection } from "./BasePropsSection";
import { SharedShapesSection } from "./SharedShapesSection";
import { makeFieldTypeSection } from "./FieldTypeSection";
import { FIELD_TYPE_ORDER } from "./fieldProps";

// Ordered registry — single source for both page composition and the TOC,
// same contract as components/docs/conditions/sections.ts and .../wizards/
// sections.ts. Base props and Shared shapes come first (shapes before the
// per-type sections that name them — see SharedShapesSection's comment),
// then one entry per built-in FieldType, generated from FIELD_TYPE_ORDER via
// makeFieldTypeSection rather than 24 hand-written section files.
export const SECTIONS: { id: string; title: string; Section: React.ComponentType }[] = [
  BasePropsSection,
  SharedShapesSection,
  ...FIELD_TYPE_ORDER.map(makeFieldTypeSection),
];

export const TOC_ITEMS: TocItem[] = SECTIONS.map(({ id, title }) => ({ id, title }));
