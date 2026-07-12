import Link from "next/link";
import { NavLinks } from "./NavLinks";
import { NAV_CONTAINER } from "@/components/shared/containers";
import { cn } from "@/lib/utils";
import { t } from "@/locales";

const GITHUB_URL = "https://github.com/YoussefNesafe/form-builder";

/**
 * Shared header for every page except /builder (that workspace stays
 * chrome-minimal, full-height). Stays a Server Component — only the
 * active-link highlighting (NavLinks) needs the client for usePathname.
 */
export function SiteNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-[16px] tablet:focus:left-[16px] desktop:focus:left-[16px] focus:top-[16px] tablet:focus:top-[16px] desktop:focus:top-[16px] focus:z-50 focus:rounded-[8px] tablet:focus:rounded-[8px] desktop:focus:rounded-[8px] focus:border focus:border-foreground focus:bg-background focus:px-[12px] tablet:focus:px-[12px] desktop:focus:px-[12px] focus:py-[8px] tablet:focus:py-[8px] desktop:focus:py-[8px] focus:text-[13px] tablet:focus:text-[13px] desktop:focus:text-[13px] focus:text-foreground focus:outline-none"
      >
        {t.common.skipToContent}
      </a>
      <nav
        className={cn(
          NAV_CONTAINER,
          "flex items-center justify-between gap-[16px] tablet:gap-[16px] desktop:gap-[16px] py-[14px] tablet:py-[16px] desktop:py-[18px]",
        )}
      >
        <Link
          href="/"
          className="border-b border-transparent text-[15px] tablet:text-[16px] desktop:text-[16px] font-semibold tracking-tight text-foreground focus-visible:border-foreground focus-visible:outline-none"
        >
          {t.nav.brand}
        </Link>
        <div className="flex items-center gap-[20px] tablet:gap-[20px] desktop:gap-[20px]">
          <NavLinks />
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t.nav.githubLabel}
            className="flex items-center border-b border-transparent text-muted-foreground transition-colors hover:text-foreground focus-visible:border-foreground focus-visible:outline-none"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="size-[18px] tablet:size-[18px] desktop:size-[18px]"
            >
              <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.757-1.333-1.757-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.605-2.665-.303-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222 0 1.606-.015 2.898-.015 3.293 0 .321.216.694.825.576C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
            </svg>
          </a>
        </div>
      </nav>
    </header>
  );
}
