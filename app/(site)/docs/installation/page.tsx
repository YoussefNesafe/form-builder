import type { Metadata } from "next";
import { DocsPageShell } from "@/components/docs/DocsPageShell";
import { Intro } from "@/components/docs/installation/Intro";
import { Footnote } from "@/components/docs/installation/Footnote";
import { SECTIONS, TOC_ITEMS } from "@/components/docs/installation/sections";
import { t } from "@/locales";

export const metadata: Metadata = { title: t.docs.nav.pages.installation };

/**
 * Copy-in adoption guide. Source of truth is the README's "Adopting the
 * engine" section — this page restates it as a walkthrough with code blocks
 * instead of a flat list. Verified against package.json, components.json,
 * and components/ui/* on 2026-07-11: the shadcn add list below is the exact
 * set of primitives present under components/ui/ in this repo.
 *
 * Thin composer only — content lives in components/docs/installation/*, one
 * file per section, ordered by ./sections.ts (also the TOC's single source).
 */
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
