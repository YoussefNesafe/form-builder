import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type SectionHeadingProps = {
  children: ReactNode;
  /** Showcase/comparison center this; flagship's and capabilities' sit left-aligned. Default true. */
  center?: boolean;
  className?: string;
  /** Set so the section wrapper can point `aria-labelledby` at this heading — every landing section does. */
  id?: string;
};

/**
 * The h2 class cluster shared by 4 of the landing page's sections. Feature-
 * local on purpose (not components/shared/) — nothing outside components/home
 * uses this exact size/tracking ramp.
 */
export function SectionHeading({ children, center = true, className, id }: SectionHeadingProps) {
  return (
    <h2
      id={id}
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
