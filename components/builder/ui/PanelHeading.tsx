import type { ReactNode } from "react";

/** Small uppercase section label shared by the builder's panel headers (Fields, Preview, Properties). */
export function PanelHeading({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-[13px] tablet:text-[13px] desktop:text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </h2>
  );
}
