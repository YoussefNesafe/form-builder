"use client";

import { useRef, useState } from "react";
import { Plus } from "lucide-react";
import type { FieldType } from "@/form-builder";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { builder } from "@/locales/en/builder";
import { fieldTypes } from "@/locales/en/fieldTypes";
import {
  FIELD_GROUP_ORDER,
  FIELD_META,
  type FieldGroup,
} from "./model/fieldMeta";
import { FieldIcon } from "./ui/FieldIcon";

// Completeness pin: the dictionary can't reference FieldGroup itself (one-way
// locales → builder boundary), so anchor Record<FieldGroup, string> here — a
// renamed/added FieldGroup fails compilation at this line, not silently at render.
const GROUP_LABELS: Record<FieldGroup, string> = builder.fieldList.groups;

const TYPES_BY_GROUP = FIELD_GROUP_ORDER.map((group) => ({
  group,
  types: (Object.keys(FIELD_META) as FieldType[]).filter(
    (type) => FIELD_META[type].group === group,
  ),
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
        <Button
          ref={triggerRef}
          variant="outline"
          size={size}
          className="w-full"
        >
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
        className="max-h-[112.14vw] tablet:max-h-[52.5vw] desktop:max-h-[21.84vw] overflow-y-auto gap-[3.204vw] tablet:gap-[1.5vw] desktop:gap-[0.624vw]"
      >
        {TYPES_BY_GROUP.map(({ group, types }) => (
          <div
            key={group}
            className="flex flex-col gap-[1.068vw] tablet:gap-[0.5vw] desktop:gap-[0.208vw]"
          >
            <div className="px-[1.602vw] tablet:px-[0.75vw] desktop:px-[0.312vw] text-[2.937vw] tablet:text-[1.375vw] desktop:text-[0.572vw] font-medium uppercase tracking-wide text-muted-foreground">
              {GROUP_LABELS[group]}
            </div>
            <div className="grid grid-cols-2 gap-[1.068vw] tablet:gap-[0.5vw] desktop:gap-[0.208vw]">
              {types.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    onPick(type);
                    setOpen(false);
                  }}
                  className="flex items-center gap-[2.136vw] tablet:gap-[1vw] desktop:gap-[0.416vw] rounded-[2.136vw] tablet:rounded-[1vw] desktop:rounded-[0.416vw] border border-transparent px-[2.136vw] tablet:px-[1vw] desktop:px-[0.416vw] py-[1.602vw] tablet:py-[0.75vw] desktop:py-[0.312vw] text-left text-[3.471vw] tablet:text-[1.625vw] desktop:text-[0.676vw] hover:bg-muted hover:border-border"
                >
                  <FieldIcon
                    type={type}
                    className="shrink-0 text-muted-foreground"
                  />
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
