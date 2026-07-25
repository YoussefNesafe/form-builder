import { cn } from "@/lib/utils";
import { t } from "@/locales";

export function Logo({
  withWordmark = false,
  className,
}: {
  withWordmark?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-[2.136vw] tablet:gap-[1vw] desktop:gap-[0.416vw]", className)}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        role="img"
        aria-label={withWordmark ? undefined : t.nav.brand}
        aria-hidden={withWordmark ? true : undefined}
        className="size-[6.408vw] tablet:size-[3vw] desktop:size-[1.248vw]"
      >
        <g stroke="#7f98f5" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8.5 4.5C6.8 4.5 6.8 6 6.8 7.8C6.8 10.2 5.6 10.8 4.4 12C5.6 13.2 6.8 13.8 6.8 16.2C6.8 18 6.8 19.5 8.5 19.5" />
          <path d="M15.5 4.5C17.2 4.5 17.2 6 17.2 7.8C17.2 10.2 18.4 10.8 19.6 12C18.4 13.2 17.2 13.8 17.2 16.2C17.2 18 17.2 19.5 15.5 19.5" />
        </g>
        <g fill="currentColor">
          <rect x="9" y="7.6" width="6" height="1.7" rx="0.85" />
          <rect x="9" y="11.15" width="3.9" height="1.7" rx="0.85" />
          <rect x="9" y="14.7" width="4.9" height="1.7" rx="0.85" />
        </g>
      </svg>
      {withWordmark && (
        <span className="text-[4.005vw] tablet:text-[2vw] desktop:text-[0.832vw] font-semibold tracking-tight text-foreground">
          {t.nav.brand}
        </span>
      )}
    </span>
  );
}
