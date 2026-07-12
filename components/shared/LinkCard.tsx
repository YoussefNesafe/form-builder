import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type LinkCardProps = {
  href: string;
  title: string;
  description: string;
  /** Small uppercase label above the title (showcase cards only). */
  kicker?: string;
  /** Decorative preview slot rendered above the kicker/title (showcase cards only). */
  children?: ReactNode;
  className?: string;
};

/**
 * Shared card-as-link primitive — the common denominator of the showcase
 * (app/(site) home), docs index, and examples index card patterns. Padding
 * and gap differ per site (16px docs/examples vs 20px showcase) so callers
 * override them via `className` (merged with `cn`, which tailwind-merges
 * conflicting utilities); everything else — border, radius, hover/focus
 * states, title/description type — is identical across all three call
 * sites and stays fixed here.
 */
export function LinkCard({ href, title, description, kicker, children, className }: LinkCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex flex-col gap-[4px] tablet:gap-[4px] desktop:gap-[4px] rounded-[12px] tablet:rounded-[12px] desktop:rounded-[12px] border border-border-interactive bg-card p-[16px] tablet:p-[16px] desktop:p-[16px] transition-colors hover:border-border-interactive-hover focus-visible:border-foreground focus-visible:outline-none",
        className,
      )}
    >
      {children}
      {kicker && (
        <span className="text-[11px] tablet:text-[11px] desktop:text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {kicker}
        </span>
      )}
      <span className="text-[15px] tablet:text-[15px] desktop:text-[15px] font-medium text-card-foreground">
        {title}
      </span>
      <span className="text-[13px] tablet:text-[13px] desktop:text-[13px] text-muted-foreground">{description}</span>
    </Link>
  );
}
