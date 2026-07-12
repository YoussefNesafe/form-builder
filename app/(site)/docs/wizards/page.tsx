import type { Metadata } from "next";
import { DocsPageShell } from "@/components/docs/DocsPageShell";
import { Intro } from "@/components/docs/wizards/Intro";
import { Footnote } from "@/components/docs/wizards/Footnote";
import { SECTIONS, TOC_ITEMS } from "@/components/docs/wizards/sections";
import { t } from "@/locales";

export const metadata: Metadata = { title: t.docs.nav.pages.wizards };

/**
 * Reference + light tutorial for the steps config: shape, gating, conditional
 * steps, the review step, and the otp dependsOn cross-step caveat. Verified
 * against core/types.ts (StepConfig), components/FormStepper.tsx,
 * components/ReviewStep.tsx, and the dev-warns in core/schema.ts — not a
 * design doc's proposal, the shipped behavior.
 *
 * Thin composer only — content lives in components/docs/wizards/*, one file
 * per section, ordered by ./sections.ts (also the TOC's single source).
 */
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
