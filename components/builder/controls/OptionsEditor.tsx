"use client";

import { ChevronDown, ChevronUp, Plus, X } from "lucide-react";
import type { Option } from "@/form-builder";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import type { ControlProps } from "./types";

/** Edit an `Option[]` (label / value / disabled), with add, remove, reorder. */
export function OptionsEditor({ id, value, onChange }: ControlProps<Option[]>) {
  const options = value ?? [];

  const commit = (next: Option[]) => onChange(next.length ? next : undefined);
  const patch = (i: number, p: Partial<Option>) => commit(options.map((o, idx) => (idx === i ? { ...o, ...p } : o)));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= options.length) return;
    const next = [...options];
    [next[i], next[j]] = [next[j], next[i]];
    commit(next);
  };

  return (
    <div id={id} className="flex flex-col gap-[8px] tablet:gap-[8px] desktop:gap-[8px]">
      {options.map((o, i) => (
        <div
          key={i}
          className="flex flex-col gap-[6px] tablet:gap-[6px] desktop:gap-[6px] rounded-[10px] tablet:rounded-[10px] desktop:rounded-[10px] border border-border p-[8px] tablet:p-[8px] desktop:p-[8px]"
        >
          <div className="flex items-center gap-[6px] tablet:gap-[6px] desktop:gap-[6px]">
            <Input
              aria-label={`Option ${i + 1} label`}
              placeholder="Label"
              value={String(o.label ?? "")}
              onChange={(e) => patch(i, { label: e.target.value })}
            />
            <Input
              aria-label={`Option ${i + 1} value`}
              placeholder="value"
              value={String(o.value ?? "")}
              onChange={(e) => patch(i, { value: e.target.value })}
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-[6px] tablet:gap-[6px] desktop:gap-[6px] text-[12px] tablet:text-[12px] desktop:text-[12px] text-muted-foreground">
              <Switch checked={o.disabled === true} onCheckedChange={(c) => patch(i, { disabled: c || undefined })} />
              Disabled
            </label>
            <div className="flex items-center">
              <Button variant="ghost" size="icon-xs" aria-label={`Move option ${i + 1} up`} onClick={() => move(i, -1)}>
                <ChevronUp />
              </Button>
              <Button variant="ghost" size="icon-xs" aria-label={`Move option ${i + 1} down`} onClick={() => move(i, 1)}>
                <ChevronDown />
              </Button>
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label={`Remove option ${i + 1}`}
                className="text-muted-foreground hover:text-destructive"
                onClick={() => commit(options.filter((_, idx) => idx !== i))}
              >
                <X />
              </Button>
            </div>
          </div>
        </div>
      ))}
      <Button
        variant="outline"
        size="sm"
        onClick={() => commit([...options, { label: `Option ${options.length + 1}`, value: `option-${options.length + 1}` }])}
      >
        <Plus />
        Add option
      </Button>
    </div>
  );
}
