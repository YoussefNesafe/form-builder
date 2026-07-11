import Link from "next/link";
import { NavLinks } from "./NavLinks";

/**
 * Shared header for every page except /builder (that workspace stays
 * chrome-minimal, full-height). Stays a Server Component — only the
 * active-link highlighting (NavLinks) needs the client for usePathname.
 */
export function SiteNav() {
  return (
    <header className="border-b border-border">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-[16px] tablet:focus:left-[16px] desktop:focus:left-[16px] focus:top-[16px] tablet:focus:top-[16px] desktop:focus:top-[16px] focus:z-50 focus:rounded-[8px] tablet:focus:rounded-[8px] desktop:focus:rounded-[8px] focus:border focus:border-foreground focus:bg-background focus:px-[12px] tablet:focus:px-[12px] desktop:focus:px-[12px] focus:py-[8px] tablet:focus:py-[8px] desktop:focus:py-[8px] focus:text-[13px] tablet:focus:text-[13px] desktop:focus:text-[13px] focus:text-foreground focus:outline-none"
      >
        Skip to content
      </a>
      <nav className="mx-auto flex w-full max-w-[1080px] tablet:max-w-[1080px] desktop:max-w-[1080px] items-center justify-between gap-[16px] tablet:gap-[16px] desktop:gap-[16px] px-[16px] tablet:px-[24px] desktop:px-[32px] py-[14px] tablet:py-[14px] desktop:py-[14px]">
        <Link
          href="/"
          className="border-b border-transparent text-[14px] tablet:text-[14px] desktop:text-[14px] font-semibold tracking-tight text-foreground focus-visible:border-foreground focus-visible:outline-none"
        >
          Form Builder
        </Link>
        <NavLinks />
      </nav>
    </header>
  );
}
