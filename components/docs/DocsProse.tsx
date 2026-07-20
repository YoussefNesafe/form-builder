import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function DocsH1({ children }: { children: ReactNode }) {
  return (
    <h1 className="text-[7.476vw] tablet:text-[3.5vw] desktop:text-[1.456vw] font-semibold leading-[9.612vw] tablet:leading-[4.5vw] desktop:leading-[1.872vw]">
      {children}
    </h1>
  );
}

export function DocsH2({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <h2
      id={id}
      className="text-[5.073vw] tablet:text-[2.375vw] desktop:text-[0.988vw] font-semibold leading-[7.476vw] tablet:leading-[3.5vw] desktop:leading-[1.456vw]"
    >
      {children}
    </h2>
  );
}

export function DocsBody({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        "text-[4.005vw] tablet:text-[1.875vw] desktop:text-[0.78vw] leading-[6.675vw] tablet:leading-[3.125vw] desktop:leading-[1.3vw] text-muted-foreground",
        className,
      )}
    >
      {children}
    </p>
  );
}

export function DocsInlineCode({ children }: { children: ReactNode }) {
  return (
    <code className="rounded-[1.068vw] tablet:rounded-[0.5vw] desktop:rounded-[0.208vw] bg-muted px-[1.068vw] tablet:px-[0.5vw] desktop:px-[0.208vw] py-[0.534vw] tablet:py-[0.25vw] desktop:py-[0.104vw] text-[3.471vw] tablet:text-[1.625vw] desktop:text-[0.676vw]">
      {children}
    </code>
  );
}

export function DocsIntro({ title, children }: { title: ReactNode; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-[2.136vw] tablet:gap-[1vw] desktop:gap-[0.416vw]">
      <DocsH1>{title}</DocsH1>
      <DocsBody>{children}</DocsBody>
    </div>
  );
}

export function DocsSection({ id, title, children }: { id?: string; title: ReactNode; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-[2.67vw] tablet:gap-[1.25vw] desktop:gap-[0.52vw]">
      <DocsH2 id={id}>{title}</DocsH2>
      {children}
    </section>
  );
}

export function DocsFootnote({ children }: { children: ReactNode }) {
  return (
    <p className="text-[3.471vw] tablet:text-[1.625vw] desktop:text-[0.676vw] text-muted-foreground">{children}</p>
  );
}

const NOTE_BORDER = {
  note: "border-border-interactive",
  warning: "border-accent-brand",
  danger: "border-destructive",
} as const;

const NOTE_LABEL_COLOR = {
  note: "text-muted-foreground",
  warning: "text-accent-brand",
  danger: "text-destructive",
} as const;

export function DocsNote({
  variant = "note",
  label,
  children,
}: {
  variant?: keyof typeof NOTE_BORDER;
  label: ReactNode;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-[1.068vw] tablet:gap-[0.5vw] desktop:gap-[0.208vw] border-s-[0.534vw] tablet:border-s-[0.25vw] desktop:border-s-[0.104vw] ps-[3.204vw] tablet:ps-[1.5vw] desktop:ps-[0.624vw]",
        NOTE_BORDER[variant],
      )}
    >
      <span
        className={cn(
          "text-[3.204vw] tablet:text-[1.5vw] desktop:text-[0.624vw] font-semibold uppercase tracking-[0.267vw] tablet:tracking-[0.125vw] desktop:tracking-[0.052vw]",
          NOTE_LABEL_COLOR[variant],
        )}
      >
        {label}
      </span>
      <p className="text-[4.005vw] tablet:text-[1.875vw] desktop:text-[0.78vw] leading-[6.675vw] tablet:leading-[3.125vw] desktop:leading-[1.3vw] text-muted-foreground">
        {children}
      </p>
    </div>
  );
}
