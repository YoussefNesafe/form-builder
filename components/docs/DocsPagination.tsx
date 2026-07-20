"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getDocsPagination } from "@/lib/docsNav";
import { docs } from "@/locales/en/docs";

export function DocsPagination() {
  const pathname = usePathname();
  const { prev, next } = getDocsPagination(pathname);

  if (!prev && !next) return null;

  return (
    <nav
      aria-label={docs.pagination.label}
      className="mt-[10.68vw] tablet:mt-[5vw] desktop:mt-[2.08vw] grid grid-cols-1 tablet:grid-cols-2 desktop:grid-cols-2 gap-[3.204vw] tablet:gap-[1.5vw] desktop:gap-[0.624vw] border-t border-border pt-[6.408vw] tablet:pt-[3vw] desktop:pt-[1.248vw]"
    >
      {prev ? (
        <Link
          href={prev.href}
          className="flex flex-col gap-[1.068vw] tablet:gap-[0.5vw] desktop:gap-[0.208vw] rounded-[2.67vw] tablet:rounded-[1.25vw] desktop:rounded-[0.52vw] border border-border-interactive p-[3.738vw] tablet:p-[1.75vw] desktop:p-[0.728vw] transition-colors hover:border-border-interactive-hover focus-visible:border-foreground focus-visible:outline-none"
        >
          <span className="text-[3.204vw] tablet:text-[1.5vw] desktop:text-[0.624vw] text-muted-foreground">
            {docs.pagination.previous}
          </span>
          <span className="text-[3.738vw] tablet:text-[1.75vw] desktop:text-[0.728vw] font-medium text-foreground">
            {prev.title}
          </span>
        </Link>
      ) : (
        <span aria-hidden="true" />
      )}
      {next ? (
        <Link
          href={next.href}
          className="flex flex-col items-end gap-[1.068vw] tablet:gap-[0.5vw] desktop:gap-[0.208vw] rounded-[2.67vw] tablet:rounded-[1.25vw] desktop:rounded-[0.52vw] border border-border-interactive p-[3.738vw] tablet:p-[1.75vw] desktop:p-[0.728vw] text-right transition-colors hover:border-border-interactive-hover focus-visible:border-foreground focus-visible:outline-none"
        >
          <span className="text-[3.204vw] tablet:text-[1.5vw] desktop:text-[0.624vw] text-muted-foreground">
            {docs.pagination.next}
          </span>
          <span className="text-[3.738vw] tablet:text-[1.75vw] desktop:text-[0.728vw] font-medium text-foreground">
            {next.title}
          </span>
        </Link>
      ) : (
        <span aria-hidden="true" />
      )}
    </nav>
  );
}
