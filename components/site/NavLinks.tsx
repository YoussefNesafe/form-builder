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

export function NavLinks() {
  const pathname = usePathname();

  return (
    <ul className="flex items-center gap-[5.34vw] tablet:gap-[2.5vw] desktop:gap-[1.04vw]">
      {NAV_LINKS.map((link) => {
        const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <li key={link.href}>
            <Link
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "border-b border-transparent text-[3.471vw] tablet:text-[1.625vw] desktop:text-[0.676vw] transition-colors focus-visible:border-foreground focus-visible:outline-none",
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
