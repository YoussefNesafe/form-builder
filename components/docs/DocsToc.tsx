"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { docs } from "@/locales/en/docs";

export type TocItem = { id: string; title: string };

export function DocsToc({ items }: { items: TocItem[] }) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (items.length === 0) return;

    const intersecting = new Map<string, boolean>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          intersecting.set(entry.target.id, entry.isIntersecting);
        }
        const topmost = items.find((item) => intersecting.get(item.id));
        if (topmost) setActiveId(topmost.id);
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
      className="hidden desktop:sticky desktop:top-[4.16vw] desktop:block desktop:w-[11.232vw] desktop:shrink-0 desktop:self-start desktop:py-[2.496vw]"
    >
      <span
        id="docs-toc-heading"
        className="desktop:text-[0.572vw] font-medium uppercase tracking-wide text-muted-foreground"
      >
        {docs.toc.onThisPage}
      </span>
      <ul className="desktop:mt-[0.624vw] flex flex-col">
        {items.map((item) => {
          const active = item.id === activeId;
          return (
            <li key={item.id}>
              <Link
                href={`#${item.id}`}
                aria-current={active ? "location" : undefined}
                className={cn(
                  "desktop:block desktop:py-[0.208vw] desktop:text-[0.676vw] border-l-2 desktop:pl-[0.624vw] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground",
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
