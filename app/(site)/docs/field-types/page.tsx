import type { Metadata } from "next";
import { DocsPageShell } from "@/components/docs/DocsPageShell";
import { Intro } from "@/components/docs/field-types/Intro";
import { FieldTypesTableSection } from "@/components/docs/field-types/FieldTypesTableSection";
import { Footnote } from "@/components/docs/field-types/Footnote";
import { TOC_ITEMS } from "@/components/docs/field-types/sections";
import { t } from "@/locales";

export const metadata: Metadata = { title: t.docs.nav.pages.fieldTypes };

/**
 * Reference table of every built-in field type — a single section (no H2s,
 * no TOC), so it composes directly rather than looping a SECTIONS registry.
 *
 * Thin composer only — content lives in components/docs/field-types/*.
 */
export default function FieldTypesPage() {
  return (
    <DocsPageShell toc={TOC_ITEMS} gap="20">
      <Intro />
      <FieldTypesTableSection />
      <Footnote />
    </DocsPageShell>
  );
}
