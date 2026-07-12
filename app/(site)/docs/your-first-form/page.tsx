import type { Metadata } from "next";
import { DocsPageShell } from "@/components/docs/DocsPageShell";
import { Intro } from "@/components/docs/your-first-form/Intro";
import { Footnote } from "@/components/docs/your-first-form/Footnote";
import { SECTIONS, TOC_ITEMS } from "@/components/docs/your-first-form/sections";
import { t } from "@/locales";

export const metadata: Metadata = { title: t.docs.nav.pages.yourFirstForm };

/**
 * Tutorial: build the smallest possible FormConfig, render it with
 * FormRenderer, and see what the engine did for free. Deeper wiring
 * (conditions, wizards, cross-field rules) is deliberately out of scope —
 * see /examples for those.
 *
 * Thin composer only — content lives in components/docs/your-first-form/*,
 * one file per section, ordered by ./sections.ts (also the TOC's single
 * source).
 */
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
