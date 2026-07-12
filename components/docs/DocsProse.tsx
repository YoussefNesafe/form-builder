import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Shared docs prose primitives — extracted per the visual spec (§1.4) after
 * H2/P/IC were confirmed byte-identical across 5 docs pages (conditions,
 * installation, field-types, your-first-form, wizards). One place to change
 * the docs type scale instead of five, so it can't drift again. Sizes are
 * flat across breakpoints on purpose — docs prose doesn't scale like the
 * landing page's display type does (see spec §1.4), but the triplicated-px
 * form is kept per AGENTS.md convention (matches DocsPagination's existing
 * pattern for flat values).
 *
 * DocsIntro/DocsSection/DocsFootnote (added in the docs-prose-primitives
 * slice) extract the three markup patterns repeated across the same five
 * pages (~5/~20/~5 copies respectively — see components/docs/sections.test.tsx for the id
 * contract DocsSection preserves): the H1+intro block, the per-section
 * wrapper, and the trailing cross-link paragraph. Pure structural
 * extraction — the copy itself stays wherever it already lived (long-form
 * docs prose is out of scope per the staff-engineer ruling).
 */

/** Page title — 28px/36px line-height, normal tracking (no tracking-tight). */
export function DocsH1({ children }: { children: ReactNode }) {
  return (
    <h1 className="text-[7.476vw] tablet:text-[3.5vw] desktop:text-[1.456vw] font-semibold leading-[9.612vw] tablet:leading-[4.5vw] desktop:leading-[1.872vw]">
      {children}
    </h1>
  );
}

/** Section heading — 19px/28px line-height, normal tracking. Optional `id` is the TOC anchor target. */
export function DocsH2({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <h2
      id={id}
      className="text-[5.073vw] tablet:text-[2.375vw] desktop:text-[0.988vw] font-semibold leading-[7.476vw] tablet:leading-[3.5vw] desktop:leading-[1.456vw]"
    >
      {children}
    </h2>
  );
}

/** Body copy — 15px/25px line-height (~1.7 ratio, matches the reference). */
export function DocsBody({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        "text-[4.005vw] tablet:text-[1.875vw] desktop:text-[0.78vw] leading-[6.675vw] tablet:leading-[3.125vw] desktop:leading-[1.3vw] text-muted-foreground",
        className,
      )}
    >
      {children}
    </p>
  );
}

/** Inline code span — 13px (unchanged), shared so every docs page matches. */
export function DocsInlineCode({ children }: { children: ReactNode }) {
  return (
    <code className="rounded-[1.068vw] tablet:rounded-[0.5vw] desktop:rounded-[0.208vw] bg-muted px-[1.068vw] tablet:px-[0.5vw] desktop:px-[0.208vw] py-[0.534vw] tablet:py-[0.25vw] desktop:py-[0.104vw] text-[3.471vw] tablet:text-[1.625vw] desktop:text-[0.676vw]">
      {children}
    </code>
  );
}

/**
 * Page-top H1 + intro paragraph block (gap-[2.136vw]) — identical wrapper across
 * every docs content page and the docs index. `children` is the intro
 * paragraph's content (rendered inside DocsBody), which may itself contain
 * inline links/`<IC>` — this only owns the wrapper, not the copy.
 */
export function DocsIntro({ title, children }: { title: ReactNode; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-[2.136vw] tablet:gap-[1vw] desktop:gap-[0.416vw]">
      <DocsH1>{title}</DocsH1>
      <DocsBody>{children}</DocsBody>
    </div>
  );
}

/**
 * `<section>` wrapper (gap-[2.67vw]) around a DocsH2 + its body — the ~20x
 * repeated pattern across the five docs content pages. `id` is forwarded to
 * DocsH2 as the TOC anchor target; each docs page's `sections.ts` derives
 * TOC_ITEMS from the same `id` binding a section passes here, and
 * components/docs/sections.test.tsx render-checks the two stay in sync.
 */
export function DocsSection({ id, title, children }: { id?: string; title: ReactNode; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-[2.67vw] tablet:gap-[1.25vw] desktop:gap-[0.52vw]">
      <DocsH2 id={id}>{title}</DocsH2>
      {children}
    </section>
  );
}

/** Trailing 13px cross-link paragraph — the "see also" footer repeated at the bottom of every docs page. */
export function DocsFootnote({ children }: { children: ReactNode }) {
  return (
    <p className="text-[3.471vw] tablet:text-[1.625vw] desktop:text-[0.676vw] text-muted-foreground">{children}</p>
  );
}
