"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DOCS_NAV_GROUPS, DOCS_PAGES } from "@/lib/docsNav";

/**
 * "Docs / Group / Page" trail above the H1 (spec §5.3), driven by
 * DOCS_NAV_GROUPS so it can't drift from the sidebar/pagination — same
 * single-source-of-truth property as the rest of lib/docsNav.ts. Client leaf
 * for usePathname, same pattern as DocsSidebar/DocsPagination. Rendered once
 * in app/docs/layout.tsx above {children}. Not rendered on the docs index
 * itself — "Docs / Overview" pointing at the page you're already on is not
 * useful orientation.
 */
export function DocsBreadcrumb() {
  const pathname = usePathname();
  if (pathname === "/docs") return null;

  const page = DOCS_PAGES.find((item) => item.href === pathname);
  const group = DOCS_NAV_GROUPS.find((g) => g.items.some((item) => item.href === pathname));
  if (!page || !group) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className="mb-[12px] tablet:mb-[12px] desktop:mb-[12px] text-[12px] tablet:text-[12px] desktop:text-[12px] text-muted-foreground"
    >
      <ol className="flex items-center gap-[6px] tablet:gap-[6px] desktop:gap-[6px]">
        <li>
          <Link href="/docs" className="hover:text-foreground">
            Docs
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
