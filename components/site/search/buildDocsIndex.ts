import type { FieldType } from "@/form-builder";
import { DOCS_PAGES } from "@/lib/docsNav";
import { TOC_ITEMS as installationToc } from "@/components/docs/installation/sections";
import { TOC_ITEMS as firstFormToc } from "@/components/docs/your-first-form/sections";
import { TOC_ITEMS as conditionsToc } from "@/components/docs/conditions/sections";
import { TOC_ITEMS as wizardsToc } from "@/components/docs/wizards/sections";
import { TOC_ITEMS as serverValidationToc } from "@/components/docs/server-validation/sections";
import { fieldTypes, type FieldTypeCopy } from "@/locales/en/fieldTypes";
import { docs } from "@/locales/en/docs";
import type { SearchEntry } from "./types";

const pageDescriptions: Record<string, string> = {
  "/docs/installation": docs.index.descriptions.installation,
  "/docs/your-first-form": docs.index.descriptions.yourFirstForm,
  "/docs/conditions": docs.index.descriptions.conditions,
  "/docs/wizards": docs.index.descriptions.wizards,
  "/docs/server-validation": docs.index.descriptions.serverValidation,
  "/docs/field-types": docs.index.descriptions.fieldTypes,
};

const HEADING_SOURCES: { href: string; toc: { id: string; title: string }[] }[] = [
  { href: "/docs/installation", toc: installationToc },
  { href: "/docs/your-first-form", toc: firstFormToc },
  { href: "/docs/conditions", toc: conditionsToc },
  { href: "/docs/wizards", toc: wizardsToc },
  { href: "/docs/server-validation", toc: serverValidationToc },
];

function buildIndex(): SearchEntry[] {
  const pages: SearchEntry[] = DOCS_PAGES.map((page) => ({
    id: page.href,
    title: page.title,
    href: page.href,
    group: "page",
    excerpt: pageDescriptions[page.href],
  }));

  const headings: SearchEntry[] = HEADING_SOURCES.flatMap(({ href, toc }) =>
    toc.map((item) => ({
      id: `${href}#${item.id}`,
      title: item.title,
      href: `${href}#${item.id}`,
      group: "heading" as const,
    })),
  );

  const fields: SearchEntry[] = (
    Object.entries(fieldTypes) as [FieldType, FieldTypeCopy][]
  ).map(([type, info]) => ({
    id: `field-type-${type}`,
    title: info.label,
    href: `/docs/field-types#field-type-${type}`,
    group: "fieldType",
    excerpt: info.description,
    keywords: info.note,
  }));

  return [...pages, ...fields, ...headings];
}

export const docsSearchIndex: SearchEntry[] = buildIndex();
