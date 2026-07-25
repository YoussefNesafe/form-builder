import type { Metadata } from "next";
import { DocsPageShell } from "@/components/docs/DocsPageShell";
import { Intro } from "@/components/docs/submit-to-backend/Intro";
import { Footnote } from "@/components/docs/submit-to-backend/Footnote";
import { SECTIONS, TOC_ITEMS } from "@/components/docs/submit-to-backend/sections";
import { t } from "@/locales";

export const metadata: Metadata = { title: t.docs.nav.pages.submitToBackend };

export default function SubmitToBackendPage() {
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
