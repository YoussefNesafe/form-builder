"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { nav } from "@/locales/en/nav";

const NAV_LINKS = [
  { href: "/builder", label: nav.links.builder },
  { href: "/examples", label: nav.links.examples },
  { href: "/docs", label: nav.links.docs },
] as const;

/**
 * Just the link list, split out as a client component so only it needs the
 * pathname (for aria-current) — the rest of SiteNav stays server-rendered.
 */
export function NavLinks() {
  const pathname = usePathname();

  return (
    <ul className="flex items-center gap-[20px] tablet:gap-[20px] desktop:gap-[20px]">
      {NAV_LINKS.map((link) => {
        const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <li key={link.href}>
            <Link
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "border-b border-transparent text-[13px] tablet:text-[13px] desktop:text-[13px] transition-colors focus-visible:border-foreground focus-visible:outline-none",
                active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {link.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
