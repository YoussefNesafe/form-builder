"use client";

import { useRef } from "react";
import type { FieldType } from "@/form-builder";
import { builder } from "@/locales/en/builder";
import { useBuilderStore } from "./model/store";
import { FieldListRow } from "./FieldListRow";
import { AddFieldMenu } from "./AddFieldMenu";
import { PanelHeading } from "./ui/PanelHeading";

/** Nearest scrollable ancestor, or null (the window scrolls) on mobile. */
function scrollParent(el: HTMLElement | null): HTMLElement | null {
  let node = el?.parentElement ?? null;
  while (node) {
    const overflowY = getComputedStyle(node).overflowY;
    if ((overflowY === "auto" || overflowY === "scroll") && node.scrollHeight > node.clientHeight) return node;
    node = node.parentElement;
  }
  return null;
}

/** Left pane: the ordered list of top-level fields plus the add-field menu. */
export function FieldList() {
  const nodes = useBuilderStore((s) => s.nodes);
  const addNode = useBuilderStore((s) => s.addNode);
  const rootRef = useRef<HTMLDivElement>(null);

  const addAndScrollToTop = (type: FieldType) => {
    addNode(type);
    // After the row mounts, return the list (desktop pane) or page (mobile) to the top.
    requestAnimationFrame(() => {
      scrollParent(rootRef.current)?.scrollTo({ top: 0 });
      window.scrollTo({ top: 0 });
    });
  };

  return (
    <div ref={rootRef} className="flex h-full flex-col gap-[12px] tablet:gap-[12px] desktop:gap-[12px]">
      <div className="flex items-center justify-between">
        <PanelHeading>{builder.fieldList.heading}</PanelHeading>
        <span className="text-[12px] tablet:text-[12px] desktop:text-[12px] text-muted-foreground">
          {nodes.length}
        </span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-[6px] tablet:gap-[6px] desktop:gap-[6px] overflow-y-auto">
        {nodes.length === 0 ? (
          <p className="rounded-[10px] tablet:rounded-[10px] desktop:rounded-[10px] border border-dashed border-border px-[12px] tablet:px-[12px] desktop:px-[12px] py-[24px] tablet:py-[24px] desktop:py-[24px] text-center text-[13px] tablet:text-[13px] desktop:text-[13px] text-muted-foreground">
            {builder.fieldList.empty}
          </p>
        ) : (
          nodes.map((node) => <FieldListRow key={node._id} node={node} />)
        )}
      </div>

      <AddFieldMenu onPick={addAndScrollToTop} />
    </div>
  );
}
