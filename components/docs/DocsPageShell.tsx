import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { DocsToc, type TocItem } from "@/components/docs/DocsToc";

// Static full class strings per gap value — Tailwind can't see built names,
// same rule as the cva variants (AGENTS.md).
const GAP_CLASS = {
  "20": "gap-[20px] tablet:gap-[20px] desktop:gap-[20px]",
  "28": "gap-[28px] tablet:gap-[28px] desktop:gap-[28px]",
} as const;

/**
 * Shared 3-column docs page plumbing: [prose column (720px cap) | TOC rail].
 * Extracted from the five docs content pages (rule of three — same argument
 * as DocsProse.tsx). Pages own their TOC_ITEMS; this owns the layout.
 */
export function DocsPageShell({
  toc,
  gap = "28",
  children,
}: {
  toc: TocItem[];
  gap?: keyof typeof GAP_CLASS;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col desktop:flex-row gap-0 desktop:gap-[32px] items-start">
      <div className={cn("min-w-0 w-full desktop:max-w-[720px] flex flex-col", GAP_CLASS[gap])}>
        {children}
      </div>
      <DocsToc items={toc} />
    </div>
  );
}
