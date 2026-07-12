"use client";

import { useRef, useState } from "react";
import { Plus } from "lucide-react";
import type { FieldType } from "@/form-builder";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { builder } from "@/locales/en/builder";
import { fieldTypes } from "@/locales/en/fieldTypes";
import { FIELD_GROUP_ORDER, FIELD_META, type FieldGroup } from "./model/fieldMeta";
import { FieldIcon } from "./ui/FieldIcon";

// Completeness pin: the dictionary can't reference FieldGroup itself (one-way
// locales → builder boundary), so anchor Record<FieldGroup, string> here — a
// renamed/added FieldGroup fails compilation at this line, not silently at render.
const GROUP_LABELS: Record<FieldGroup, string> = builder.fieldList.groups;

const TYPES_BY_GROUP = FIELD_GROUP_ORDER.map((group) => ({
  group,
  types: (Object.keys(FIELD_META) as FieldType[]).filter((type) => FIELD_META[type].group === group),
}));

/** Grouped field-type picker. Calls `onPick(type)` and closes. */
export function AddFieldMenu({
  onPick,
  label = builder.fieldList.addField,
  size = "sm",
}: {
  onPick: (type: FieldType) => void;
  label?: string;
  size?: "sm" | "xs";
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button ref={triggerRef} variant="outline" size={size} className="w-full">
          <Plus />
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        // Return focus to the trigger WITHOUT scrolling (Radix's default focus()
        // would scroll down to reveal the trigger below the list). Dropping focus
        // entirely strands keyboard users at <body> — a11y finding.
        onCloseAutoFocus={(e) => {
          e.preventDefault();
          triggerRef.current?.focus({ preventScroll: true });
        }}
        className="max-h-[420px] tablet:max-h-[420px] desktop:max-h-[420px] overflow-y-auto gap-[12px] tablet:gap-[12px] desktop:gap-[12px]"
      >
        {TYPES_BY_GROUP.map(({ group, types }) => (
          <div key={group} className="flex flex-col gap-[4px] tablet:gap-[4px] desktop:gap-[4px]">
            <div className="px-[6px] tablet:px-[6px] desktop:px-[6px] text-[11px] tablet:text-[11px] desktop:text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              {GROUP_LABELS[group]}
            </div>
            <div className="grid grid-cols-2 gap-[4px] tablet:gap-[4px] desktop:gap-[4px]">
              {types.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    onPick(type);
                    setOpen(false);
                  }}
                  className="flex items-center gap-[8px] tablet:gap-[8px] desktop:gap-[8px] rounded-[8px] tablet:rounded-[8px] desktop:rounded-[8px] border border-transparent px-[8px] tablet:px-[8px] desktop:px-[8px] py-[6px] tablet:py-[6px] desktop:py-[6px] text-left text-[13px] tablet:text-[13px] desktop:text-[13px] hover:bg-muted hover:border-border"
                >
                  <FieldIcon type={type} className="shrink-0 text-muted-foreground" />
                  <span className="truncate">{fieldTypes[type].label}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </PopoverContent>
    </Popover>
  );
}
