import type { Metadata } from "next";
import { DocsPageShell } from "@/components/docs/DocsPageShell";
import { Intro } from "@/components/docs/installation/Intro";
import { Footnote } from "@/components/docs/installation/Footnote";
import { SECTIONS, TOC_ITEMS } from "@/components/docs/installation/sections";
import { t } from "@/locales";

export const metadata: Metadata = { title: t.docs.nav.pages.installation };

/**
 * Adoption guide. Leads with the one-command CLI installer (cli/bin/form-
 * builder.mjs, see docs/adr/0003-packaging-split-distribution.md Revision 2)
 * — pre-release, not published to npm yet, see the InstallCliSection's
 * availability callout. The pre-CLI manual copy-in flow (download the zip,
 * `shadcn add` the primitives by hand, paste the CSS block, register fields)
 * follows as a documented fallback; it's still accurate, just no longer the
 * first thing a reader sees. Verified against cli/src/{cli,install,plan,
 * detect,theme,rewrite}.mjs, scripts/build-registry.mjs, package.json, and
 * components/ui/* on 2026-07-18 (branch feat/packaging-phase-0).
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
