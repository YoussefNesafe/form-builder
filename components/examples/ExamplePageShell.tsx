import type { ReactNode } from "react";

type ExamplePageShellProps = {
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
};

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
