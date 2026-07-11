"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export type TocItem = { id: string; title: string };

/**
 * Desktop-only "On this page" rail (spec §5.1). Items come from each page's
 * own static TOC_ITEMS array — no runtime heading extraction, matching this
 * repo's static-source-of-truth convention (cf. lib/docsNav.ts). The one
 * piece of unavoidable DOM interaction is scroll-spy: a single
 * IntersectionObserver instance watches every heading's real element (by
 * id) to track which section is nearest the top of the viewport, purely for
 * the active *visual* state — it never steals focus. Pages with no H2s pass
 * an empty array and this renders null (same null-guard pattern as
 * DocsPagination).
 */
export function DocsToc({ items }: { items: TocItem[] }) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (items.length === 0) return;

    // The callback only receives entries whose intersection CHANGED, in no
    // guaranteed order — track every heading's state across callbacks and
    // highlight the topmost (in items order) currently-intersecting one.
    const intersecting = new Map<string, boolean>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          intersecting.set(entry.target.id, entry.isIntersecting);
        }
        const topmost = items.find((item) => intersecting.get(item.id));
        if (topmost) setActiveId(topmost.id);
        // No heading in the band (e.g. a short last section): keep the
        // previous active id rather than clearing the highlight.
      },
      { rootMargin: "-80px 0px -70% 0px", threshold: 0 },
    );

    for (const item of items) {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [items]);

  if (items.length === 0) return null;

  return (
    <nav
      aria-labelledby="docs-toc-heading"
      className="hidden desktop:sticky desktop:top-[80px] desktop:block desktop:w-[216px] desktop:shrink-0 desktop:self-start desktop:py-[48px]"
    >
      <span
        id="docs-toc-heading"
        className="desktop:text-[11px] font-medium uppercase tracking-wide text-muted-foreground"
      >
        On this page
      </span>
      <ul className="desktop:mt-[12px] flex flex-col">
        {items.map((item) => {
          const active = item.id === activeId;
          return (
            <li key={item.id}>
              <Link
                href={`#${item.id}`}
                aria-current={active ? "location" : undefined}
                className={cn(
                  "desktop:block desktop:py-[4px] desktop:text-[13px] border-l-2 desktop:pl-[12px] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground",
                  active
                    ? "border-foreground font-medium text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {item.title}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
