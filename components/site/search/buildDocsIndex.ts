import type { FieldType } from "@/form-builder";
import { DOCS_PAGES } from "@/lib/docsNav";
import { TOC_ITEMS as installationToc } from "@/components/docs/installation/sections";
import { TOC_ITEMS as firstFormToc } from "@/components/docs/your-first-form/sections";
import { TOC_ITEMS as conditionsToc } from "@/components/docs/conditions/sections";
import { TOC_ITEMS as wizardsToc } from "@/components/docs/wizards/sections";
import { fieldTypes, type FieldTypeCopy } from "@/locales/en/fieldTypes";
import { docs } from "@/locales/en/docs";
import type { SearchEntry } from "./types";

/**
 * SERVER-ONLY index builder (no "use client"): imported by the server-rendered
 * SiteNav, which serializes the resulting plain-data array down to the client
 * palette as a prop. Because only {id,title} strings cross the boundary, the
 * docs section *components* these `sections.ts` modules reference never reach
 * the client bundle.
 *
 * Everything here is DERIVED from existing single-source data — nothing is
 * hand-authored for search, so it can't drift (the staff-engineer ruling
 * explicitly forbids a parallel hand-maintained keyword list). Coverage:
 *  - one entry per docs page (title + index blurb, from DOCS_PAGES / docs dict)
 *  - one entry per section heading on the four prose pages (from their TOC)
 *  - one entry per built-in field type (from the fieldTypes dictionary),
 *    deep-linking to that type's anchor on /docs/field-types
 *
 * Field-type headings are taken from the dictionary rather than importing
 * components/docs/field-types/sections.ts on purpose — that module runs a
 * 24× section factory (CodeBlock/PropsTable/…); the dictionary gives the same
 * 24 anchors as plain data, and adds the description/note as searchable text.
 */

const pageDescriptions: Record<string, string> = {
  "/docs/installation": docs.index.descriptions.installation,
  "/docs/your-first-form": docs.index.descriptions.yourFirstForm,
  "/docs/conditions": docs.index.descriptions.conditions,
  "/docs/wizards": docs.index.descriptions.wizards,
  "/docs/field-types": docs.index.descriptions.fieldTypes,
};

// Prose pages whose H2 sections deep-link. field-types is intentionally absent
// (its sections are emitted from the dictionary below); /docs is a hub with no
// H2 sections.
const HEADING_SOURCES: { href: string; toc: { id: string; title: string }[] }[] = [
  { href: "/docs/installation", toc: installationToc },
  { href: "/docs/your-first-form", toc: firstFormToc },
  { href: "/docs/conditions", toc: conditionsToc },
  { href: "/docs/wizards", toc: wizardsToc },
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

/** Built once at module load on the server. */
export const docsSearchIndex: SearchEntry[] = buildIndex();
