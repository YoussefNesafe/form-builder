"use client";

import type { TextRules } from "@/form-builder";
import { Input } from "@/components/ui/input";
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
import { pruneEmptyOrUndefined } from "./clean";
import { NONE_VALUE } from "./sentinels";
import type { ControlProps } from "./types";

const C = builder.controls.rules;

/** Edit `TextRules` (length, pattern, message, trim, allow, matches). */
export function RulesEditor({ id, value, onChange, ctx }: ControlProps<TextRules>) {
  const r = value ?? {};
  const patch = (p: Partial<TextRules>) => onChange(pruneEmptyOrUndefined({ ...r, ...p }));
  const num = (raw: string) => (raw === "" ? undefined : Number(raw));
  // Cross-field wiring resolves same-level names; the engine rejects it
  // inside groups — hide the row there, like the other wiring props.
  const matchNames = ctx.isNested ? [] : eligibleRefs(ctx.siblings, "textFamily", ctx.node._id);

  return (
    <div id={id} className="flex flex-col gap-[8px] tablet:gap-[8px] desktop:gap-[8px] rounded-[10px] tablet:rounded-[10px] desktop:rounded-[10px] border border-border p-[8px] tablet:p-[8px] desktop:p-[8px]">
      <div className="grid grid-cols-2 gap-[6px] tablet:gap-[6px] desktop:gap-[6px]">
        <LabeledInput label={C.minLength} type="number" value={r.minLength ?? ""} onChange={(v) => patch({ minLength: num(v) })} />
        <LabeledInput label={C.maxLength} type="number" value={r.maxLength ?? ""} onChange={(v) => patch({ maxLength: num(v) })} />
      </div>
      <LabeledInput label={C.pattern} value={r.pattern ?? ""} onChange={(v) => patch({ pattern: v || undefined })} />
      <LabeledInput label={C.patternMessage} value={r.message ?? ""} onChange={(v) => patch({ message: v || undefined })} />
      <LabeledInput label={C.allow} value={r.allow ?? ""} onChange={(v) => patch({ allow: v || undefined })} placeholder={C.allowPlaceholder} />
      {matchNames.length > 0 && (
        <>
          <label className="flex flex-col gap-[4px] tablet:gap-[4px] desktop:gap-[4px] text-[11px] tablet:text-[11px] desktop:text-[11px] text-muted-foreground">
            {C.matchField}
            <Select
              value={r.matches ?? NONE_VALUE}
              onValueChange={(v) =>
                patch(v === NONE_VALUE ? { matches: undefined, matchesMessage: undefined } : { matches: v })
              }
            >
              <SelectTrigger aria-label={C.matchField} className="w-full">
                <SelectValue placeholder={C.none} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_VALUE}>{C.none}</SelectItem>
                {matchNames.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
          {r.matches !== undefined && (
            <LabeledInput
              label={C.matchMessage}
              value={r.matchesMessage ?? ""}
              onChange={(v) => patch({ matchesMessage: v || undefined })}
            />
          )}
        </>
      )}
      <label className="flex items-center gap-[6px] tablet:gap-[6px] desktop:gap-[6px] text-[12px] tablet:text-[12px] desktop:text-[12px] text-muted-foreground">
        <Switch checked={r.trim === true} onCheckedChange={(c) => patch({ trim: c || undefined })} />
        {C.trim}
      </label>
    </div>
  );
}

function LabeledInput({
  label,
  value,
  onChange,
  type,
  placeholder,
}: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-[4px] tablet:gap-[4px] desktop:gap-[4px] text-[11px] tablet:text-[11px] desktop:text-[11px] text-muted-foreground">
      {label}
      <Input type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}
