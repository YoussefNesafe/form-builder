"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { nav } from "@/locales/en/nav";
import type { SearchEntry } from "./search/types";

const SearchPalette = dynamic(
  () => import("./SearchPalette").then((m) => m.SearchPalette),
  { ssr: false },
);

export function SearchTrigger({ index }: { index: SearchEntry[] }) {
  const [open, setOpen] = useState(false);
  const [instance, setInstance] = useState(0);
  const openRef = useRef(false);

  const setOpenSynced = useCallback((next: boolean) => {
    openRef.current = next;
    setOpen(next);
  }, []);

  const openPalette = useCallback(() => {
    if (!openRef.current) setInstance((n) => n + 1);
    setOpenSynced(true);
  }, [setOpenSynced]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (openRef.current) setOpenSynced(false);
        else openPalette();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [openPalette, setOpenSynced]);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="lg"
        onClick={openPalette}
        aria-label={nav.search.triggerAriaLabel}
        aria-keyshortcuts="Meta+K Control+K"
        data-icon="inline-start"
        className="desktop:px-[1.04vw] desktop:py-[0.936vw] desktop:w-[10.4vw] flex justify-between items-center"
      >
        <div className="flex gap-[1.068vw] tablet:gap-[0.5vw] desktop:gap-[0.208vw] items-center">
          <SearchIcon aria-hidden="true" />
          <span className="hidden tablet:inline">
            {nav.search.triggerLabel}
          </span>
        </div>
        <kbd
          aria-hidden="true"
          className={cn(
            "hidden tablet:inline-flex items-center rounded-[1.602vw] tablet:rounded-[0.75vw] desktop:rounded-[0.312vw]",
            "border border-border ms-[1.602vw] tablet:ms-[0.75vw] desktop:ms-[0.312vw]",
            "px-[1.068vw] tablet:px-[0.5vw] desktop:px-[0.208vw]",
            "text-[3.204vw] tablet:text-[1.5vw] desktop:text-[0.624vw] font-medium text-muted-foreground",
          )}
        >
          {nav.search.shortcutHint}
        </kbd>
      </Button>
      {instance > 0 && (
        <SearchPalette
          key={instance}
          index={index}
          open={open}
          onOpenChange={setOpenSynced}
        />
      )}
    </>
  );
}
