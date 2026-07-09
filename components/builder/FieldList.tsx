"use client";

import { useBuilderStore } from "./model/store";
import { FieldListRow } from "./FieldListRow";
import { AddFieldMenu } from "./AddFieldMenu";

/** Left pane: the ordered list of top-level fields plus the add-field menu. */
export function FieldList() {
  const nodes = useBuilderStore((s) => s.nodes);
  const addNode = useBuilderStore((s) => s.addNode);

  return (
    <div className="flex h-full flex-col gap-[12px] tablet:gap-[12px] desktop:gap-[12px]">
      <div className="flex items-center justify-between">
        <h2 className="text-[13px] tablet:text-[13px] desktop:text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
          Fields
        </h2>
        <span className="text-[12px] tablet:text-[12px] desktop:text-[12px] text-muted-foreground">
          {nodes.length}
        </span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-[6px] tablet:gap-[6px] desktop:gap-[6px] overflow-y-auto">
        {nodes.length === 0 ? (
          <p className="rounded-[10px] tablet:rounded-[10px] desktop:rounded-[10px] border border-dashed border-border px-[12px] tablet:px-[12px] desktop:px-[12px] py-[24px] tablet:py-[24px] desktop:py-[24px] text-center text-[13px] tablet:text-[13px] desktop:text-[13px] text-muted-foreground">
            No fields yet. Add one to get started.
          </p>
        ) : (
          nodes.map((node) => <FieldListRow key={node._id} node={node} />)
        )}
      </div>

      <AddFieldMenu onPick={(type) => addNode(type)} />
    </div>
  );
}
