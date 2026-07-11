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
