import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type LinkCardProps = {
  href: string;
  title: string;
  description: string;
  kicker?: string;
  children?: ReactNode;
  className?: string;
  ariaLabel?: string;
};

export function LinkCard({ href, title, description, kicker, children, className, ariaLabel }: LinkCardProps) {
  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      className={cn(
        "flex flex-col gap-[1.068vw] tablet:gap-[0.5vw] desktop:gap-[0.208vw] rounded-[3.204vw] tablet:rounded-[1.5vw] desktop:rounded-[0.624vw] border border-border-interactive bg-card p-[4.272vw] tablet:p-[2vw] desktop:p-[0.832vw] transition-colors hover:border-border-interactive-hover focus-visible:border-foreground focus-visible:outline-none",
        className,
      )}
    >
      {children}
      {kicker && (
        <span className="text-[2.937vw] tablet:text-[1.375vw] desktop:text-[0.572vw] font-medium uppercase tracking-wide text-muted-foreground">
          {kicker}
        </span>
      )}
      <span className="text-[4.005vw] tablet:text-[1.875vw] desktop:text-[0.78vw] font-medium text-card-foreground">
        {title}
      </span>
      <span className="text-[3.471vw] tablet:text-[1.625vw] desktop:text-[0.676vw] text-muted-foreground">{description}</span>
    </Link>
  );
}
