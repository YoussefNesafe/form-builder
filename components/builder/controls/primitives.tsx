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
import { builder } from "@/locales/en/builder";
import { eligibleRefs } from "../model/context";
import { NONE_VALUE } from "./sentinels";
import type { ControlProps } from "./types";

const C = builder.controls.primitives;

export function TextControl({ id, value, onChange }: ControlProps<string>) {
  return (
    <Input
      id={id}
      value={value ?? ""}
      onChange={(e) =>
        onChange(e.target.value === "" ? undefined : e.target.value)
      }
    />
  );
}

export function TextareaControl({ id, value, onChange }: ControlProps<string>) {
  return (
    <Textarea
      id={id}
      value={value ?? ""}
      onChange={(e) =>
        onChange(e.target.value === "" ? undefined : e.target.value)
      }
    />
  );
}

export function NumberControl({
  id,
  value,
  onChange,
  descriptor,
}: ControlProps<number>) {
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
  return (
    <Switch
      id={id}
      checked={value === true}
      onCheckedChange={(c) => onChange(c || undefined)}
    />
  );
}

export function DateControl({ id, value, onChange }: ControlProps<string>) {
  return (
    <Input
      id={id}
      type="date"
      value={value ?? ""}
      onChange={(e) =>
        onChange(e.target.value === "" ? undefined : e.target.value)
      }
    />
  );
}

export function TimeControl({ id, value, onChange }: ControlProps<string>) {
  return (
    <Input
      id={id}
      type="time"
      value={value ?? ""}
      onChange={(e) =>
        onChange(e.target.value === "" ? undefined : e.target.value)
      }
    />
  );
}

export function PenColorControl({ id, value, onChange }: ControlProps<string>) {
  return (
    <div className="flex items-center gap-[2.136vw] tablet:gap-[1vw] desktop:gap-[0.416vw]">
      <Input
        aria-label={C.penColorAriaLabel}
        type="color"
        value={value ?? "#000000"}
        onChange={(e) => onChange(e.target.value)}
        className="h-[8.544vw] tablet:h-[4vw] desktop:h-[1.664vw] w-[11.748vw] tablet:w-[5.5vw] desktop:w-[2.288vw] p-[0.534vw] tablet:p-[0.25vw] desktop:p-[0.104vw]"
      />
      <Input
        id={id}
        value={value ?? ""}
        placeholder={C.penColorPlaceholder}
        onChange={(e) =>
          onChange(e.target.value === "" ? undefined : e.target.value)
        }
      />
    </div>
  );
}

export function SelectControl({
  id,
  value,
  onChange,
  descriptor,
}: ControlProps<string>) {
  const options = descriptor.options ?? [];
  return (
    <Select
      value={value ?? NONE_VALUE}
      onValueChange={(v) => onChange(v === NONE_VALUE ? undefined : v)}
    >
      <SelectTrigger id={id} className="w-full">
        <SelectValue placeholder={C.selectDefault} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NONE_VALUE}>{C.selectDefault}</SelectItem>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function FieldRefControl({
  id,
  value,
  onChange,
  descriptor,
  ctx,
}: ControlProps<string>) {
  const names = eligibleRefs(
    ctx.siblings,
    descriptor.refKind ?? "any",
    ctx.node._id,
  );
  return (
    <Select
      value={value ?? NONE_VALUE}
      onValueChange={(v) => onChange(v === NONE_VALUE ? undefined : v)}
    >
      <SelectTrigger id={id} className="w-full">
        <SelectValue placeholder={C.fieldRefNone} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NONE_VALUE}>{C.fieldRefNone}</SelectItem>
        {names.map((name) => (
          <SelectItem key={name} value={name}>
            {name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function MaskControl(props: ControlProps<string>) {
  return <TextControl {...props} />;
}

export function JsonControl({ id, value, onChange }: ControlProps<unknown>) {
  const text =
    value === undefined
      ? ""
      : typeof value === "string"
        ? value
        : JSON.stringify(value);
  return (
    <Textarea
      id={id}
      value={text}
      placeholder={C.jsonPlaceholder}
      onChange={(e) => {
        const raw = e.target.value;
        if (raw === "") return onChange("");
        try {
          onChange(JSON.parse(raw));
        } catch {
          onChange(raw);
        }
      }}
    />
  );
}
