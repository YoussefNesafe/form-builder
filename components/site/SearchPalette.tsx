"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { nav } from "@/locales/en/nav";
import { searchDocs } from "./search/search";
import { resolveNav } from "./search/resolveNav";
import { logEmptyQuery } from "./search/queryLog";
import type { SearchEntry, SearchGroup } from "./search/types";

type Props = {
  index: SearchEntry[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function focusAnchor(el: HTMLElement, behavior: ScrollBehavior) {
  el.scrollIntoView({ behavior });
  el.setAttribute("tabindex", "-1");
  el.focus({ preventScroll: true });
}

function scrollToHashAfterNav(id: string, framesLeft = 30) {
  const el = document.getElementById(id);
  if (el) {
    focusAnchor(el, "auto");
    return;
  }
  if (framesLeft > 0) {
    requestAnimationFrame(() => scrollToHashAfterNav(id, framesLeft - 1));
  }
}

const GROUP_ORDER: { group: SearchGroup; heading: string }[] = [
  { group: "page", heading: nav.search.groups.pages },
  { group: "fieldType", heading: nav.search.groups.fieldTypes },
  { group: "heading", heading: nav.search.groups.sections },
];

export function SearchPalette({ index, open, onOpenChange }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState("");

  const results = useMemo(() => searchDocs(index, query), [index, query]);
  const groups = useMemo(
    () =>
      GROUP_ORDER.map(({ group, heading }) => ({
        heading,
        items: results.filter((entry) => entry.group === group),
      })).filter((bucket) => bucket.items.length > 0),
    [results],
  );

  useEffect(() => {
    if (!query.trim() || results.length > 0) return;
    const id = window.setTimeout(() => logEmptyQuery(query), 500);
    return () => window.clearTimeout(id);
  }, [query, results.length]);

  const go = (href: string) => {
    onOpenChange(false);
    const action = resolveNav(href, pathname);
    if (action.kind === "scroll") {
      const el = document.getElementById(action.id);
      if (el) focusAnchor(el, "smooth");
      window.history.replaceState(null, "", action.href);
      return;
    }
    router.push(action.href);
    const hashIndex = action.href.indexOf("#");
    if (hashIndex !== -1) scrollToHashAfterNav(action.href.slice(hashIndex + 1));
  };

  const trimmed = query.trim();

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title={nav.search.dialogTitle}
      description={nav.search.dialogDescription}
    >
      <Command shouldFilter={false}>
        <CommandInput
          value={query}
          onValueChange={setQuery}
          placeholder={nav.search.placeholder}
        />
        <CommandList>
          <CommandEmpty>
            {nav.search.noResults}
            {trimmed ? ` “${trimmed}”` : ""}
          </CommandEmpty>
          {groups.map((bucket) => (
            <CommandGroup key={bucket.heading} heading={bucket.heading}>
              {bucket.items.map((entry) => (
                <CommandItem
                  key={entry.id}
                  value={entry.id}
                  onSelect={() => go(entry.href)}
                >
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate">{entry.title}</span>
                    {entry.excerpt && (
                      <span className="truncate text-[3.204vw] tablet:text-[1.5vw] desktop:text-[0.624vw] text-muted-foreground">
                        {entry.excerpt}
                      </span>
                    )}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
