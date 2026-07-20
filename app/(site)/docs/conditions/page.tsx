import type { Metadata } from "next";
import { DocsPageShell } from "@/components/docs/DocsPageShell";
import { Intro } from "@/components/docs/conditions/Intro";
import { Footnote } from "@/components/docs/conditions/Footnote";
import { SECTIONS, TOC_ITEMS } from "@/components/docs/conditions/sections";
import { t } from "@/locales";

export const metadata: Metadata = { title: t.docs.nav.pages.conditions };

export default function ConditionsPage() {
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
