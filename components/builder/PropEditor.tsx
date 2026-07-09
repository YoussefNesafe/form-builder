"use client";

import { useBuilderStore } from "./model/store";

/** Right pane: prop editor for the selected field. Filled in Phase 4. */
export function PropEditorPanel() {
  const selectedId = useBuilderStore((s) => s.selectedId);

  return (
    <div className="flex h-full flex-col gap-[12px] tablet:gap-[12px] desktop:gap-[12px]">
      <h2 className="text-[13px] tablet:text-[13px] desktop:text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
        Properties
      </h2>
      {selectedId ? (
        <p className="text-[13px] tablet:text-[13px] desktop:text-[13px] text-muted-foreground">
          Editor coming in the next phase.
        </p>
      ) : (
        <p className="text-[13px] tablet:text-[13px] desktop:text-[13px] text-muted-foreground">
          Select a field to edit its properties.
        </p>
      )}
    </div>
  );
}
