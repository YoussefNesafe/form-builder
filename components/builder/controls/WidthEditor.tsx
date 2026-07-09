"use client";

import type { FieldWidth, ResponsiveFieldWidth } from "@/form-builder";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ControlProps } from "./types";

const WIDTHS: FieldWidth[] = ["full", "half", "third", "quarter"];
const NONE = "__none__";

function WidthSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: FieldWidth | undefined;
  onChange: (w: FieldWidth | undefined) => void;
}) {
  return (
    <div className="flex flex-col gap-[4px] tablet:gap-[4px] desktop:gap-[4px]">
      <span className="text-[11px] tablet:text-[11px] desktop:text-[11px] text-muted-foreground">{label}</span>
      <Select
        value={value ?? NONE}
        onValueChange={(v) => onChange(v === NONE ? undefined : (v as FieldWidth))}
      >
        <SelectTrigger aria-label={label} className="w-full">
          <SelectValue placeholder="full" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE}>full (default)</SelectItem>
          {WIDTHS.map((w) => (
            <SelectItem key={w} value={w}>
              {w}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/**
 * Edit a `ResponsiveFieldWidth`: a uniform width (string) or one per breakpoint
 * (object). Toggling to per-breakpoint seeds the object from the uniform value.
 */
export function WidthEditor({ id, value, onChange }: ControlProps<ResponsiveFieldWidth>) {
  const isObject = typeof value === "object" && value !== null;
  const uniform = typeof value === "string" ? value : undefined;
  const obj = isObject ? value : {};

  const setMode = (perBreakpoint: boolean) => {
    // Seed an (empty) object even at the default width so the toggle actually
    // switches modes; the object form resolves to full when a breakpoint is unset.
    if (perBreakpoint) onChange(uniform ? { mobile: uniform } : {});
    else onChange(isObject ? value.mobile : undefined);
  };

  const patchBreakpoint = (bp: "mobile" | "tablet" | "desktop", w: FieldWidth | undefined) => {
    const next = { ...obj, [bp]: w };
    if (w === undefined) delete next[bp];
    onChange(Object.keys(next).length ? next : undefined);
  };

  return (
    <div id={id} className="flex flex-col gap-[8px] tablet:gap-[8px] desktop:gap-[8px]">
      <div className="flex items-center gap-[6px] tablet:gap-[6px] desktop:gap-[6px] text-[12px] tablet:text-[12px] desktop:text-[12px]">
        <button
          type="button"
          onClick={() => setMode(false)}
          className={`rounded-[8px] tablet:rounded-[8px] desktop:rounded-[8px] border px-[8px] tablet:px-[8px] desktop:px-[8px] py-[3px] tablet:py-[3px] desktop:py-[3px] ${!isObject ? "border-primary bg-muted" : "border-border"}`}
        >
          Uniform
        </button>
        <button
          type="button"
          onClick={() => setMode(true)}
          className={`rounded-[8px] tablet:rounded-[8px] desktop:rounded-[8px] border px-[8px] tablet:px-[8px] desktop:px-[8px] py-[3px] tablet:py-[3px] desktop:py-[3px] ${isObject ? "border-primary bg-muted" : "border-border"}`}
        >
          Per breakpoint
        </button>
      </div>

      {isObject ? (
        <div className="grid grid-cols-3 gap-[6px] tablet:gap-[6px] desktop:gap-[6px]">
          <WidthSelect label="Mobile" value={value.mobile} onChange={(w) => patchBreakpoint("mobile", w)} />
          <WidthSelect label="Tablet" value={value.tablet} onChange={(w) => patchBreakpoint("tablet", w)} />
          <WidthSelect label="Desktop" value={value.desktop} onChange={(w) => patchBreakpoint("desktop", w)} />
        </div>
      ) : (
        <WidthSelect label="Width" value={uniform} onChange={(w) => onChange(w)} />
      )}
    </div>
  );
}
