"use client";

/** Center pane: live form preview. Filled in Phase 5. */
export function PreviewPanel() {
  return (
    <div className="flex h-full flex-col gap-[12px] tablet:gap-[12px] desktop:gap-[12px]">
      <h2 className="text-[13px] tablet:text-[13px] desktop:text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
        Preview
      </h2>
      <div className="flex flex-1 items-center justify-center rounded-[12px] tablet:rounded-[12px] desktop:rounded-[12px] border border-dashed border-border text-[13px] tablet:text-[13px] desktop:text-[13px] text-muted-foreground">
        Live preview coming in the next phase.
      </div>
    </div>
  );
}
