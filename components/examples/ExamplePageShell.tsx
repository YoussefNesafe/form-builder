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
    <div className="flex flex-col gap-[20px] tablet:gap-[20px] desktop:gap-[20px]">
      <div className="flex flex-col gap-[8px] tablet:gap-[8px] desktop:gap-[8px]">
        <h1 className="text-[24px] tablet:text-[24px] desktop:text-[24px] font-semibold tracking-tight">{title}</h1>
        {description}
      </div>
      {children}
    </div>
  );
}
