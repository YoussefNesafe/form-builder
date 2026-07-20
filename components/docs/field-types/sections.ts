import type { TocItem } from "@/components/docs/DocsToc";
import { BasePropsSection } from "./BasePropsSection";
import { SharedShapesSection } from "./SharedShapesSection";
import { makeFieldTypeSection } from "./FieldTypeSection";
import { FIELD_TYPE_ORDER } from "./fieldProps";

export const SECTIONS: { id: string; title: string; Section: React.ComponentType }[] = [
  BasePropsSection,
  SharedShapesSection,
  ...FIELD_TYPE_ORDER.map(makeFieldTypeSection),
];

export const TOC_ITEMS: TocItem[] = SECTIONS.map(({ id, title }) => ({ id, title }));
