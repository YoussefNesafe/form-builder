"use client";

import { useEffect, useMemo } from "react";
import { Tabs as TabsPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";
import { CopyButton } from "./CopyButton";
import {
  CODE_BLOCK_CONTAINER_CLASS,
  CODE_BLOCK_COPY_PADDING_CLASS,
  CODE_BLOCK_PADDING_CLASS,
  CODE_BLOCK_TEXT_CLASS,
} from "./codeBlockStyles";
import { PACKAGE_MANAGERS, deriveCommand, type CommandKind } from "./command";
import {
  hydratePackageManagerFromStorage,
  isPackageManager,
  usePackageManager,
} from "./packageManagerStore";

type CommandBlockProps = {
  /** "execute" for a CLI runner command (npx/dlx/bunx-style, e.g. the shadcn CLI); "install" for a plain dependency install. */
  kind: CommandKind;
  /** Canonical argument string appended after each PM's prefix — the single source every tab variant derives from (see command.ts). May be multi-line/backslash-continued. */
  args: string;
  /** Accessible name for the tab list — defaults to "Package manager". */
  label?: string;
  /** Noun for the copy button's accessible name, e.g. "command" — defaults to "command". */
  copyLabel?: string;
  className?: string;
};

/**
 * Tabbed terminal command block — pnpm/npm/yarn/bun variants of ONE command,
 * mirroring shadcn/ui's own docs (github.com/shadcn-ui/ui,
 * apps/v4/components/code-block-command.tsx: tab order pnpm/npm/yarn/bun,
 * default pnpm, selection persisted). The four command strings come from
 * command.ts's `deriveCommand`, so they can't drift independently; the
 * active tab is shared across every CommandBlock on the page and persisted
 * to localStorage via packageManagerStore (see that file for the SSR-safe
 * hydration contract). Built on the already-installed `radix-ui` Tabs
 * primitive directly (same pattern as components/ui/segmented-control.tsx)
 * rather than a new components/ui/tabs.tsx wrapper — gets tablist/tab/
 * tabpanel roles, roving tabindex, and arrow-key navigation for free.
 *
 * Client leaf: the surrounding docs section (DocsSection) stays a Server
 * Component; only this component ships JS.
 */
export function CommandBlock({
  kind,
  args,
  label = "Package manager",
  copyLabel = "command",
  className,
}: CommandBlockProps) {
  const [packageManager, setPackageManagerSelection] = usePackageManager();

  // Adopt any previously stored choice after mount — first paint stays the
  // deterministic default (see packageManagerStore.ts) so there's no
  // server/client hydration mismatch.
  useEffect(() => {
    hydratePackageManagerFromStorage();
  }, []);

  const variants = useMemo(() => deriveCommand(kind, args), [kind, args]);

  return (
    <TabsPrimitive.Root
      value={packageManager}
      onValueChange={(value) => {
        // Radix only ever passes one of the values we handed its Triggers
        // below, but this keeps the setter's input honestly narrowed instead
        // of casting past it — an invalid value is silently ignored.
        if (isPackageManager(value)) setPackageManagerSelection(value);
      }}
      className={cn(
        CODE_BLOCK_CONTAINER_CLASS,
        "relative overflow-hidden",
        className,
      )}
    >
      <TabsPrimitive.List
        aria-label={label}
        className="flex items-center gap-[0.534vw] tablet:gap-[0.25vw] desktop:gap-[0.104vw] border-b border-border px-[1.602vw] tablet:px-[0.75vw] desktop:px-[0.312vw] pt-[1.602vw] tablet:pt-[0.75vw] desktop:pt-[0.312vw]"
      >
        {PACKAGE_MANAGERS.map((pm) => (
          <TabsPrimitive.Trigger
            key={pm}
            value={pm}
            className="rounded-t-[1.602vw] tablet:rounded-t-[0.75vw] desktop:rounded-t-[0.312vw] border border-b-0 border-transparent px-[2.67vw] tablet:px-[1.25vw] desktop:px-[0.52vw] py-[1.602vw] tablet:py-[0.75vw] desktop:py-[0.312vw] text-[3.471vw] tablet:text-[1.625vw] desktop:text-[0.676vw] text-muted-foreground data-[state=active]:border-border data-[state=active]:bg-background data-[state=active]:text-foreground"
          >
            {pm}
          </TabsPrimitive.Trigger>
        ))}
      </TabsPrimitive.List>
      {PACKAGE_MANAGERS.map((pm) => (
        <TabsPrimitive.Content
          key={pm}
          value={pm}
          dir="ltr"
          className={cn(
            CODE_BLOCK_TEXT_CLASS,
            CODE_BLOCK_PADDING_CLASS,
            CODE_BLOCK_COPY_PADDING_CLASS,
            "block",
          )}
        >
          {/* Long commands wrap onto the next line instead of scrolling. */}
          <pre className="whitespace-pre-wrap [overflow-wrap:anywhere]">
            <code>{variants[pm]}</code>
          </pre>
        </TabsPrimitive.Content>
      ))}
      <CopyButton
        text={variants[packageManager]}
        label={copyLabel}
        className="absolute top-[1.602vw] right-[1.602vw] tablet:top-[0.75vw] tablet:right-[0.75vw] desktop:top-[0.312vw] desktop:right-[0.312vw]"
      />
    </TabsPrimitive.Root>
  );
}
