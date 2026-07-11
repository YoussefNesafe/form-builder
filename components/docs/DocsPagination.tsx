"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getDocsPagination } from "@/lib/docsNav";

/**
 * nextjs.org-docs-style prev/next cards, driven entirely by DOCS_PAGES (see
 * lib/docsNav.ts) so the order can't drift from the sidebar. Client-only for
 * usePathname; rendered once in app/docs/layout.tsx after `{children}` so
 * every docs page gets it without editing each page file.
 */
export function DocsPagination() {
  const pathname = usePathname();
  const { prev, next } = getDocsPagination(pathname);

  if (!prev && !next) return null;

  return (
    <nav
      aria-label="Docs pagination"
      className="mt-[40px] tablet:mt-[40px] desktop:mt-[40px] grid grid-cols-1 tablet:grid-cols-2 desktop:grid-cols-2 gap-[12px] tablet:gap-[12px] desktop:gap-[12px] border-t border-border pt-[24px] tablet:pt-[24px] desktop:pt-[24px]"
    >
      {prev ? (
        <Link
          href={prev.href}
          className="flex flex-col gap-[4px] tablet:gap-[4px] desktop:gap-[4px] rounded-[10px] tablet:rounded-[10px] desktop:rounded-[10px] border border-border p-[14px] tablet:p-[14px] desktop:p-[14px] transition-colors hover:border-foreground/30 focus-visible:border-foreground focus-visible:outline-none"
        >
          <span className="text-[12px] tablet:text-[12px] desktop:text-[12px] text-muted-foreground">Previous</span>
          <span className="text-[14px] tablet:text-[14px] desktop:text-[14px] font-medium text-foreground">
            {prev.title}
          </span>
        </Link>
      ) : (
        <span aria-hidden="true" />
      )}
      {next ? (
        <Link
          href={next.href}
          className="flex flex-col items-end gap-[4px] tablet:gap-[4px] desktop:gap-[4px] rounded-[10px] tablet:rounded-[10px] desktop:rounded-[10px] border border-border p-[14px] tablet:p-[14px] desktop:p-[14px] text-right transition-colors hover:border-foreground/30 focus-visible:border-foreground focus-visible:outline-none"
        >
          <span className="text-[12px] tablet:text-[12px] desktop:text-[12px] text-muted-foreground">Next</span>
          <span className="text-[14px] tablet:text-[14px] desktop:text-[14px] font-medium text-foreground">
            {next.title}
          </span>
        </Link>
      ) : (
        <span aria-hidden="true" />
      )}
    </nav>
  );
}
