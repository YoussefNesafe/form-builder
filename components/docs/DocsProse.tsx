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
 * pages (~5/~20/~5 copies respectively — see toc.test.ts for the id
 * contract DocsSection preserves): the H1+intro block, the per-section
 * wrapper, and the trailing cross-link paragraph. Pure structural
 * extraction — the copy itself stays wherever it already lived (long-form
 * docs prose is out of scope per the staff-engineer ruling).
 */

/** Page title — 28px/36px line-height, normal tracking (no tracking-tight). */
export function DocsH1({ children }: { children: ReactNode }) {
  return (
    <h1 className="text-[28px] tablet:text-[28px] desktop:text-[28px] font-semibold leading-[36px] tablet:leading-[36px] desktop:leading-[36px]">
      {children}
    </h1>
  );
}

/** Section heading — 19px/28px line-height, normal tracking. Optional `id` is the TOC anchor target. */
export function DocsH2({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <h2
      id={id}
      className="text-[19px] tablet:text-[19px] desktop:text-[19px] font-semibold leading-[28px] tablet:leading-[28px] desktop:leading-[28px]"
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
        "text-[15px] tablet:text-[15px] desktop:text-[15px] leading-[25px] tablet:leading-[25px] desktop:leading-[25px] text-muted-foreground",
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
    <code className="rounded-[4px] tablet:rounded-[4px] desktop:rounded-[4px] bg-muted px-[4px] tablet:px-[4px] desktop:px-[4px] py-[2px] tablet:py-[2px] desktop:py-[2px] text-[13px] tablet:text-[13px] desktop:text-[13px]">
      {children}
    </code>
  );
}

/**
 * Page-top H1 + intro paragraph block (gap-[8px]) — identical wrapper across
 * every docs content page and the docs index. `children` is the intro
 * paragraph's content (rendered inside DocsBody), which may itself contain
 * inline links/`<IC>` — this only owns the wrapper, not the copy.
 */
export function DocsIntro({ title, children }: { title: ReactNode; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-[8px] tablet:gap-[8px] desktop:gap-[8px]">
      <DocsH1>{title}</DocsH1>
      <DocsBody>{children}</DocsBody>
    </div>
  );
}

/**
 * `<section>` wrapper (gap-[10px]) around a DocsH2 + its body — the ~20x
 * repeated pattern across the five docs content pages. `id` is forwarded to
 * DocsH2 as the TOC anchor target; toc.test.ts scans page source for
 * `<DocsSection id="...">` to keep TOC_ITEMS and heading ids in sync (same
 * contract it previously enforced against raw `<H2 id="...">`).
 */
export function DocsSection({ id, title, children }: { id?: string; title: ReactNode; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-[10px] tablet:gap-[10px] desktop:gap-[10px]">
      <DocsH2 id={id}>{title}</DocsH2>
      {children}
    </section>
  );
}

/** Trailing 13px cross-link paragraph — the "see also" footer repeated at the bottom of every docs page. */
export function DocsFootnote({ children }: { children: ReactNode }) {
  return (
    <p className="text-[13px] tablet:text-[13px] desktop:text-[13px] text-muted-foreground">{children}</p>
  );
}
