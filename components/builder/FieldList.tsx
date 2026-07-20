"use client";

import { useRef } from "react";
import type { FieldType } from "@/form-builder";
import { builder } from "@/locales/en/builder";
import { useBuilderStore } from "./model/store";
import { FieldListRow } from "./FieldListRow";
import { AddFieldMenu } from "./AddFieldMenu";
import { PanelHeading } from "./ui/PanelHeading";

function scrollParent(el: HTMLElement | null): HTMLElement | null {
  let node = el?.parentElement ?? null;
  while (node) {
    const overflowY = getComputedStyle(node).overflowY;
    if (
      (overflowY === "auto" || overflowY === "scroll") &&
      node.scrollHeight > node.clientHeight
    )
      return node;
    node = node.parentElement;
  }
  return null;
}

export function FieldList() {
  const nodes = useBuilderStore((s) => s.nodes);
  const addNode = useBuilderStore((s) => s.addNode);
  const rootRef = useRef<HTMLDivElement>(null);

  const addAndScrollToTop = (type: FieldType) => {
    addNode(type);
    requestAnimationFrame(() => {
      scrollParent(rootRef.current)?.scrollTo({ top: 0 });
      window.scrollTo({ top: 0 });
    });
  };

  return (
    <div
      ref={rootRef}
      className="flex h-full flex-col gap-[3.204vw] tablet:gap-[1.5vw] desktop:gap-[0.624vw]"
    >
      <div className="flex items-center justify-between">
        <PanelHeading>{builder.fieldList.heading}</PanelHeading>
        <span className="text-[3.204vw] tablet:text-[1.5vw] desktop:text-[0.624vw] text-muted-foreground">
          {nodes.length}
        </span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-[1.602vw] tablet:gap-[0.75vw] desktop:gap-[0.312vw] overflow-y-auto">
        {nodes.length === 0 ? (
          <p className="rounded-[2.67vw] tablet:rounded-[1.25vw] desktop:rounded-[0.52vw] border border-dashed border-border px-[3.204vw] tablet:px-[1.5vw] desktop:px-[0.624vw] py-[6.408vw] tablet:py-[3vw] desktop:py-[1.248vw] text-center text-[3.471vw] tablet:text-[1.625vw] desktop:text-[0.676vw] text-muted-foreground">
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
