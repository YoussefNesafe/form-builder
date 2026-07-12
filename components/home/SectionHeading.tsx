import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type SectionHeadingProps = {
  children: ReactNode;
  /** Showcase/features/comparison/finalCta center this; the demo section's h2 sits inside an already-centered wrapper and drops it. Default true. */
  center?: boolean;
  className?: string;
};

/**
 * The h2 class cluster shared by 5 of the landing page's sections. Feature-
 * local on purpose (not components/shared/) — nothing outside components/home
 * uses this exact size/tracking ramp.
 */
export function SectionHeading({ children, center = true, className }: SectionHeadingProps) {
  return (
    <h2
      className={cn(
        center && "text-center",
        "text-[24px] tablet:text-[28px] desktop:text-[32px] font-semibold tracking-[-0.5px] tablet:tracking-[-0.9px] desktop:tracking-[-1.3px]",
        className,
      )}
    >
      {children}
    </h2>
  );
}
