import type { Metadata } from "next";
import { DocsPageShell } from "@/components/docs/DocsPageShell";
import { Intro } from "@/components/docs/your-first-form/Intro";
import { Footnote } from "@/components/docs/your-first-form/Footnote";
import { SECTIONS, TOC_ITEMS } from "@/components/docs/your-first-form/sections";
import { t } from "@/locales";

export const metadata: Metadata = { title: t.docs.nav.pages.yourFirstForm };

export default function YourFirstFormPage() {
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
