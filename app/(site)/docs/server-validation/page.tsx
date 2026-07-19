import type { Metadata } from "next";
import { DocsPageShell } from "@/components/docs/DocsPageShell";
import { Intro } from "@/components/docs/server-validation/Intro";
import { Footnote } from "@/components/docs/server-validation/Footnote";
import { SECTIONS, TOC_ITEMS } from "@/components/docs/server-validation/sections";
import { t } from "@/locales";

export const metadata: Metadata = { title: t.docs.nav.pages.serverValidation };

export default function ServerValidationPage() {
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
