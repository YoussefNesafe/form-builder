"use client";

import type { PasswordComplexity } from "@/form-builder";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { builder } from "@/locales/en/builder";
import { pruneEmptyOrUndefined } from "./clean";
import type { ControlProps } from "./types";

const C = builder.controls.complexity;

const FLAGS: { key: keyof PasswordComplexity; label: string }[] = [
  { key: "uppercase", label: C.uppercase },
  { key: "lowercase", label: C.lowercase },
  { key: "number", label: C.number },
  { key: "special", label: C.specialChar },
];

/** Edit `PasswordComplexity` (character-class flags + min length). */
export function ComplexityEditor({ id, value, onChange }: ControlProps<PasswordComplexity>) {
  const c = value ?? {};
  const patch = (p: Partial<PasswordComplexity>) => onChange(pruneEmptyOrUndefined({ ...c, ...p }));

  return (
    <div id={id} className="flex flex-col gap-[8px] tablet:gap-[8px] desktop:gap-[8px] rounded-[10px] tablet:rounded-[10px] desktop:rounded-[10px] border border-border p-[8px] tablet:p-[8px] desktop:p-[8px]">
      <div className="grid grid-cols-2 gap-[6px] tablet:gap-[6px] desktop:gap-[6px]">
        {FLAGS.map((f) => (
          <label
            key={f.key}
            className="flex items-center gap-[6px] tablet:gap-[6px] desktop:gap-[6px] text-[12px] tablet:text-[12px] desktop:text-[12px] text-muted-foreground"
          >
            <Switch checked={c[f.key] === true} onCheckedChange={(v) => patch({ [f.key]: v || undefined })} />
            {f.label}
          </label>
        ))}
      </div>
      <label className="flex flex-col gap-[4px] tablet:gap-[4px] desktop:gap-[4px] text-[11px] tablet:text-[11px] desktop:text-[11px] text-muted-foreground">
        {C.minLength}
        <Input
          type="number"
          value={c.minLength ?? ""}
          onChange={(e) => patch({ minLength: e.target.value === "" ? undefined : Number(e.target.value) })}
        />
      </label>
    </div>
  );
}
