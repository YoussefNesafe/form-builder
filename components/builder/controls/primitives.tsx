"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { eligibleRefs } from "../model/context";
import type { ControlProps } from "./types";

/** Empty string clears the prop. */
export function TextControl({ id, value, onChange }: ControlProps<string>) {
  return (
    <Input
      id={id}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value === "" ? undefined : e.target.value)}
    />
  );
}

export function TextareaControl({ id, value, onChange }: ControlProps<string>) {
  return (
    <Textarea
      id={id}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value === "" ? undefined : e.target.value)}
    />
  );
}

export function NumberControl({ id, value, onChange, descriptor }: ControlProps<number>) {
  const { min, max, step, integer } = descriptor;
  return (
    <Input
      id={id}
      type="number"
      value={value ?? ""}
      min={min}
      max={max}
      step={step ?? (integer ? 1 : undefined)}
      onChange={(e) => {
        if (e.target.value === "") return onChange(undefined);
        const n = e.target.valueAsNumber;
        if (Number.isNaN(n)) return onChange(undefined);
        onChange(integer ? Math.trunc(n) : n);
      }}
    />
  );
}

export function BooleanControl({ id, value, onChange }: ControlProps<boolean>) {
  return <Switch id={id} checked={value === true} onCheckedChange={(c) => onChange(c || undefined)} />;
}

export function DateControl({ id, value, onChange }: ControlProps<string>) {
  return (
    <Input
      id={id}
      type="date"
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value === "" ? undefined : e.target.value)}
    />
  );
}

export function TimeControl({ id, value, onChange }: ControlProps<string>) {
  return (
    <Input
      id={id}
      type="time"
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value === "" ? undefined : e.target.value)}
    />
  );
}

export function PenColorControl({ id, value, onChange }: ControlProps<string>) {
  return (
    <div className="flex items-center gap-[8px] tablet:gap-[8px] desktop:gap-[8px]">
      <Input
        aria-label="Pen color"
        type="color"
        value={value ?? "#000000"}
        onChange={(e) => onChange(e.target.value)}
        className="h-[32px] tablet:h-[32px] desktop:h-[32px] w-[44px] tablet:w-[44px] desktop:w-[44px] p-[2px] tablet:p-[2px] desktop:p-[2px]"
      />
      <Input
        id={id}
        value={value ?? ""}
        placeholder="#000000"
        onChange={(e) => onChange(e.target.value === "" ? undefined : e.target.value)}
      />
    </div>
  );
}

/** Optional single-choice from descriptor.options. `__none__` clears. */
export function SelectControl({ id, value, onChange, descriptor }: ControlProps<string>) {
  const options = descriptor.options ?? [];
  return (
    <Select value={value ?? "__none__"} onValueChange={(v) => onChange(v === "__none__" ? undefined : v)}>
      <SelectTrigger id={id} className="w-full">
        <SelectValue placeholder="Default" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__none__">Default</SelectItem>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** Reference a sibling field by name; eligible set depends on descriptor.refKind. */
export function FieldRefControl({ id, value, onChange, descriptor, ctx }: ControlProps<string>) {
  const names = eligibleRefs(ctx.siblings, descriptor.refKind ?? "any", ctx.node._id);
  return (
    <Select value={value ?? "__none__"} onValueChange={(v) => onChange(v === "__none__" ? undefined : v)}>
      <SelectTrigger id={id} className="w-full">
        <SelectValue placeholder="None" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__none__">None</SelectItem>
        {names.map((name) => (
          <SelectItem key={name} value={name}>
            {name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** Mask string ("#" digit, "A" letter, "*" alphanumeric, others literal). */
export function MaskControl(props: ControlProps<string>) {
  return <TextControl {...props} />;
}

/** Arbitrary JSON value (hidden fields). Falls back to a plain string when unparseable. */
export function JsonControl({ id, value, onChange }: ControlProps<unknown>) {
  const text = value === undefined ? "" : typeof value === "string" ? value : JSON.stringify(value);
  return (
    <Textarea
      id={id}
      value={text}
      placeholder='"text", 42, true, or {"a":1}'
      onChange={(e) => {
        const raw = e.target.value;
        // Empty → "" (not undefined): a hidden field must keep its `value` key.
        if (raw === "") return onChange("");
        try {
          onChange(JSON.parse(raw));
        } catch {
          onChange(raw); // treat as a plain string until it parses
        }
      }}
    />
  );
}
