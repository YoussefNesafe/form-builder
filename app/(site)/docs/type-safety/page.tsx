import type { Metadata } from "next";
import { DocsPageShell } from "@/components/docs/DocsPageShell";
import { Intro } from "@/components/docs/type-safety/Intro";
import { Footnote } from "@/components/docs/type-safety/Footnote";
import { SECTIONS, TOC_ITEMS } from "@/components/docs/type-safety/sections";
import { t } from "@/locales";

export const metadata: Metadata = { title: t.docs.nav.pages.typeSafety };

export default function TypeSafetyPage() {
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
