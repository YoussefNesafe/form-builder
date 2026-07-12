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
        "text-[6.408vw] tablet:text-[3.5vw] desktop:text-[1.664vw] font-semibold tracking-[-0.133vw] tablet:tracking-[-0.112vw] desktop:tracking-[-0.068vw]",
        className,
      )}
    >
      {children}
    </h2>
  );
}
