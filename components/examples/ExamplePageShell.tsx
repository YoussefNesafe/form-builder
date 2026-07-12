import type { ReactNode } from "react";

type ExamplePageShellProps = {
  title: ReactNode;
  /**
   * Intro content below the H1. ReactNode (not a plain string) because
   * multi-step-signup's intro carries a second paragraph with an inline
   * `<code>` — callers own their own `<p>` wrapper(s) so that markup isn't
   * lost by forcing everything through one fixed `<p>`.
   */
  description?: ReactNode;
  children: ReactNode;
};

/**
 * Byte-identical header (H1 + intro) shared by the three /examples pages
 * (advanced-fields, conditional-profile, multi-step-signup) — extracted per
 * the rule of three, same reasoning as components/docs/DocsProse.tsx.
 */
export function ExamplePageShell({ title, description, children }: ExamplePageShellProps) {
  return (
    <div className="flex flex-col gap-[5.34vw] tablet:gap-[2.5vw] desktop:gap-[1.04vw]">
      <div className="flex flex-col gap-[2.136vw] tablet:gap-[1vw] desktop:gap-[0.416vw]">
        <h1 className="text-[6.408vw] tablet:text-[3vw] desktop:text-[1.248vw] font-semibold tracking-tight">{title}</h1>
        {description}
      </div>
      {children}
    </div>
  );
}
