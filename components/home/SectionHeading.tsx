import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type SectionHeadingProps = {
  children: ReactNode;
  center?: boolean;
  className?: string;
  id?: string;
};

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
