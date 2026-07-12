import type { Metadata } from "next";
import { DocsPageShell } from "@/components/docs/DocsPageShell";
import { Intro } from "@/components/docs/conditions/Intro";
import { Footnote } from "@/components/docs/conditions/Footnote";
import { SECTIONS, TOC_ITEMS } from "@/components/docs/conditions/sections";
import { t } from "@/locales";

export const metadata: Metadata = { title: t.docs.nav.pages.conditions };

/**
 * Reference + light tutorial for visibleWhen/disabledWhen/enabledWhen: the
 * real Condition/ConditionSpec operators from core/types.ts, why isValid is
 * restricted to disabledWhen/enabledWhen, and the group-nesting limitation
 * pinned by useDynamicForm.test.ts. Verified against form-builder/core/
 * conditions.ts, core/types.ts, and core/schema.ts — not the design doc's
 * proposal, the shipped validator.
 *
 * Thin composer only — content lives in components/docs/conditions/*, one
 * file per section, ordered by ./sections.ts (also the TOC's single
 * source).
 */
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
