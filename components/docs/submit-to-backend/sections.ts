import type { TocItem } from "@/components/docs/DocsToc";
import { ServerActionSection } from "./ServerActionSection";
import { RouteHandlerSection } from "./RouteHandlerSection";
import { ClientErrorsSection } from "./ClientErrorsSection";

export const SECTIONS: { id: string; title: string; Section: React.ComponentType }[] = [
  ServerActionSection,
  RouteHandlerSection,
  ClientErrorsSection,
];

export const TOC_ITEMS: TocItem[] = SECTIONS.map(({ id, title }) => ({ id, title }));
