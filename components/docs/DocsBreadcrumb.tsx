"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DOCS_NAV_GROUPS, DOCS_PAGES } from "@/lib/docsNav";
import { docs } from "@/locales/en/docs";

export function DocsBreadcrumb() {
  const pathname = usePathname();
  if (pathname === "/docs") return null;

  const page = DOCS_PAGES.find((item) => item.href === pathname);
  const group = DOCS_NAV_GROUPS.find((g) => g.items.some((item) => item.href === pathname));
  if (!page || !group) return null;

  return (
    <nav
      aria-label={docs.breadcrumb.label}
      className="mb-[3.204vw] tablet:mb-[1.5vw] desktop:mb-[0.624vw] text-[3.204vw] tablet:text-[1.5vw] desktop:text-[0.624vw] text-muted-foreground"
    >
      <ol className="flex items-center gap-[1.602vw] tablet:gap-[0.75vw] desktop:gap-[0.312vw]">
        <li>
          <Link href="/docs" className="hover:text-foreground">
            {docs.breadcrumb.docs}
          </Link>
        </li>
        <li aria-hidden="true">/</li>
        <li>{group.title}</li>
        <li aria-hidden="true">/</li>
        <li aria-current="page" className="text-foreground">
          {page.title}
        </li>
      </ol>
    </nav>
  );
}
