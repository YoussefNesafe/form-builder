import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { DocsToc, type TocItem } from "@/components/docs/DocsToc";

const GAP_CLASS = {
  "20": "gap-[5.34vw] tablet:gap-[2.5vw] desktop:gap-[1.04vw]",
  "28": "gap-[7.476vw] tablet:gap-[3.5vw] desktop:gap-[1.456vw]",
} as const;

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
    <div className="flex flex-col desktop:flex-row gap-0 desktop:gap-[1.664vw] items-start">
      <div className={cn("min-w-0 w-full flex flex-col", GAP_CLASS[gap])}>
        {children}
      </div>
      <DocsToc items={toc} />
    </div>
  );
}
