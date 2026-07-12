import type { Metadata } from "next";
import { DocsPageShell } from "@/components/docs/DocsPageShell";
import { Intro } from "@/components/docs/field-types/Intro";
import { Footnote } from "@/components/docs/field-types/Footnote";
import { SECTIONS, TOC_ITEMS } from "@/components/docs/field-types/sections";
import { t } from "@/locales";

export const metadata: Metadata = { title: t.docs.nav.pages.fieldTypes };

/**
 * Base props + shared shapes + one H2 per built-in field type (props table,
 * runtime value shape, example config) — content and data live in
 * components/docs/field-types/* (fieldProps.ts is the data module; sections
 * come from ./sections.ts, the TOC's single source, same contract as
 * conditions/wizards).
 *
 * Thin composer only.
 */
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
