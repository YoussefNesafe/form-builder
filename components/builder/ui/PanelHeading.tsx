import type { ReactNode } from "react";

export function PanelHeading({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-[3.471vw] tablet:text-[1.625vw] desktop:text-[0.676vw] font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </h2>
  );
}
