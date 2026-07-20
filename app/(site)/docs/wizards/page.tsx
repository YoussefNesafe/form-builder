import type { Metadata } from "next";
import { DocsPageShell } from "@/components/docs/DocsPageShell";
import { Intro } from "@/components/docs/wizards/Intro";
import { Footnote } from "@/components/docs/wizards/Footnote";
import { SECTIONS, TOC_ITEMS } from "@/components/docs/wizards/sections";
import { t } from "@/locales";

export const metadata: Metadata = { title: t.docs.nav.pages.wizards };

export default function WizardsPage() {
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
