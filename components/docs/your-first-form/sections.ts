import type { TocItem } from "@/components/docs/DocsToc";
import { WriteConfigSection } from "./WriteConfigSection";
import { RenderItSection } from "./RenderItSection";
import { TryItSection } from "./TryItSection";
import { WhatYouGetSection } from "./WhatYouGetSection";

export const SECTIONS: { id: string; title: string; Section: React.ComponentType }[] = [
  WriteConfigSection,
  RenderItSection,
  TryItSection,
  WhatYouGetSection,
];

export const TOC_ITEMS: TocItem[] = SECTIONS.map(({ id, title }) => ({ id, title }));
