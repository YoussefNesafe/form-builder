"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { DOCS_NAV_GROUPS, DOCS_PAGES } from "@/lib/docsNav";

export function DocsSidebar() {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href;

  return (
    <>
      <nav
        aria-label="Docs sections"
        className="desktop:hidden w-full min-w-0 -mx-[4.272vw] tablet:-mx-[3vw] overflow-x-auto border-b border-border px-[4.272vw] tablet:px-[3vw] py-[2.67vw] tablet:py-[1.25vw]"
      >
        <ul className="flex w-max items-center gap-[4.806vw] tablet:gap-[2.25vw]">
          {DOCS_PAGES.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={cn(
                  "block whitespace-nowrap border-b-2 tablet:border-b-2 pb-[0.534vw] tablet:pb-[0.25vw] text-[3.471vw] tablet:text-[1.625vw] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground",
                  isActive(item.href)
                    ? "border-foreground text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {item.title}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <nav
        aria-label="Docs sections"
        className="hidden desktop:sticky desktop:top-[4.16vw] desktop:block desktop:w-[12.48vw] desktop:shrink-0 desktop:self-start desktop:py-[2.496vw]"
      >
        <ul className="flex flex-col desktop:gap-[1.248vw]">
          {DOCS_NAV_GROUPS.map((group) => (
            <li key={group.title} className="flex flex-col desktop:gap-[0.416vw]">
              <span className="desktop:text-[0.572vw] font-medium uppercase tracking-wide text-muted-foreground">
                {group.title}
              </span>
              <ul className="flex flex-col desktop:gap-[0.104vw]">
                {group.items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={isActive(item.href) ? "page" : undefined}
                      className={cn(
                        "block desktop:rounded-[0.312vw] border-l-2 desktop:px-[0.52vw] desktop:py-[0.312vw] desktop:text-[0.676vw] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground",
                        isActive(item.href)
                          ? "border-foreground bg-muted font-medium text-foreground"
                          : "border-transparent text-muted-foreground hover:border-border hover:text-foreground",
                      )}
                    >
                      {item.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
