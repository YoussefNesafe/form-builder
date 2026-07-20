import type { Metadata } from "next";
import { DocsPageShell } from "@/components/docs/DocsPageShell";
import { Intro } from "@/components/docs/installation/Intro";
import { Footnote } from "@/components/docs/installation/Footnote";
import { SECTIONS, TOC_ITEMS } from "@/components/docs/installation/sections";
import { t } from "@/locales";

export const metadata: Metadata = { title: t.docs.nav.pages.installation };

export default function InstallationPage() {
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
