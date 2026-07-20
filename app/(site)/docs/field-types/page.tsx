import type { Metadata } from "next";
import { DocsPageShell } from "@/components/docs/DocsPageShell";
import { Intro } from "@/components/docs/field-types/Intro";
import { Footnote } from "@/components/docs/field-types/Footnote";
import { SECTIONS, TOC_ITEMS } from "@/components/docs/field-types/sections";
import { t } from "@/locales";

export const metadata: Metadata = { title: t.docs.nav.pages.fieldTypes };

export default function FieldTypesPage() {
  return (
    <DocsPageShell toc={TOC_ITEMS}>
      <Intro />
      {SECTIONS.map(({ id, Section }) => (
        <Section key={id} />
      ))}
      <Footnote />
    </DocsPageShell>
  );
}
