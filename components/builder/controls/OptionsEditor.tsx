"use client";

import { ChevronDown, ChevronUp, Plus, X } from "lucide-react";
import type { Option } from "@/form-builder";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { builder } from "@/locales/en/builder";
import { fmt } from "@/locales/fmt";
import type { ControlProps } from "./types";

const C = builder.controls.options;

export function OptionsEditor({ id, value, onChange }: ControlProps<Option[]>) {
  const options = value ?? [];

  const commit = (next: Option[]) => onChange(next.length ? next : undefined);
  const patch = (i: number, p: Partial<Option>) =>
    commit(options.map((o, idx) => (idx === i ? { ...o, ...p } : o)));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= options.length) return;
    const next = [...options];
    [next[i], next[j]] = [next[j], next[i]];
    commit(next);
  };

  return (
    <div
      id={id}
      className="flex flex-col gap-[2.136vw] tablet:gap-[1vw] desktop:gap-[0.416vw]"
    >
      {options.map((o, i) => (
        <div
          key={i}
          className="flex flex-col gap-[1.602vw] tablet:gap-[0.75vw] desktop:gap-[0.312vw] rounded-[2.67vw] tablet:rounded-[1.25vw] desktop:rounded-[0.52vw] border border-border p-[2.136vw] tablet:p-[1vw] desktop:p-[0.416vw]"
        >
          <div className="flex items-center gap-[1.602vw] tablet:gap-[0.75vw] desktop:gap-[0.312vw]">
            <Input
              aria-label={fmt(C.labelAriaLabel, { n: i + 1 })}
              placeholder={C.labelPlaceholder}
              value={String(o.label ?? "")}
              onChange={(e) => patch(i, { label: e.target.value })}
            />
            <Input
              aria-label={fmt(C.valueAriaLabel, { n: i + 1 })}
              placeholder={C.valuePlaceholder}
              value={String(o.value ?? "")}
              onChange={(e) => patch(i, { value: e.target.value })}
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-[1.602vw] tablet:gap-[0.75vw] desktop:gap-[0.312vw] text-[3.204vw] tablet:text-[1.5vw] desktop:text-[0.624vw] text-muted-foreground">
              <Switch
                checked={o.disabled === true}
                onCheckedChange={(c) => patch(i, { disabled: c || undefined })}
              />
              {C.disabled}
            </label>
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label={fmt(C.moveUpAriaLabel, { n: i + 1 })}
                onClick={() => move(i, -1)}
              >
                <ChevronUp />
              </Button>
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label={fmt(C.moveDownAriaLabel, { n: i + 1 })}
                onClick={() => move(i, 1)}
              >
                <ChevronDown />
              </Button>
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label={fmt(C.removeAriaLabel, { n: i + 1 })}
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
        onClick={() =>
          commit([
            ...options,
            {
              label: `Option ${options.length + 1}`,
              value: `option-${options.length + 1}`,
            },
          ])
        }
      >
        <Plus />
        {C.addOption}
      </Button>
    </div>
  );
}
