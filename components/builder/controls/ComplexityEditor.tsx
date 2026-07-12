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
export function ComplexityEditor({
  id,
  value,
  onChange,
}: ControlProps<PasswordComplexity>) {
  const c = value ?? {};
  const patch = (p: Partial<PasswordComplexity>) =>
    onChange(pruneEmptyOrUndefined({ ...c, ...p }));

  return (
    <div
      id={id}
      className="flex flex-col gap-[2.136vw] tablet:gap-[1vw] desktop:gap-[0.416vw] rounded-[2.67vw] tablet:rounded-[1.25vw] desktop:rounded-[0.52vw] border border-border p-[2.136vw] tablet:p-[1vw] desktop:p-[0.416vw]"
    >
      <div className="grid grid-cols-2 gap-[1.602vw] tablet:gap-[0.75vw] desktop:gap-[0.312vw]">
        {FLAGS.map((f) => (
          <label
            key={f.key}
            className="flex items-center gap-[1.602vw] tablet:gap-[0.75vw] desktop:gap-[0.312vw] text-[3.204vw] tablet:text-[1.5vw] desktop:text-[0.624vw] text-muted-foreground"
          >
            <Switch
              checked={c[f.key] === true}
              onCheckedChange={(v) => patch({ [f.key]: v || undefined })}
            />
            {f.label}
          </label>
        ))}
      </div>
      <label className="flex flex-col gap-[1.068vw] tablet:gap-[0.5vw] desktop:gap-[0.208vw] text-[2.937vw] tablet:text-[1.375vw] desktop:text-[0.572vw] text-muted-foreground">
        {C.minLength}
        <Input
          type="number"
          value={c.minLength ?? ""}
          onChange={(e) =>
            patch({
              minLength:
                e.target.value === "" ? undefined : Number(e.target.value),
            })
          }
        />
      </label>
    </div>
  );
}
