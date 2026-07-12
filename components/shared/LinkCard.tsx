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
  /**
   * Explicit accessible name for the link, e.g. `${title} — ${description}`.
   * Set this whenever `children` renders content that shouldn't concatenate
   * into the link's name (e.g. an `aria-hidden` code peek — `aria-hidden`
   * descendants are already excluded from accname computation, but an
   * explicit label makes that not depend on every future `children` staying
   * `aria-hidden`). Omit to let the name derive from rendered content, as
   * every non-showcase call site already does.
   */
  ariaLabel?: string;
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
