"use client";

import type { FieldWidth, ResponsiveFieldWidth } from "@/form-builder";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { builder } from "@/locales/en/builder";
import { NONE_VALUE } from "./sentinels";
import type { ControlProps } from "./types";

const C = builder.controls.width;

const WIDTHS: FieldWidth[] = ["full", "half", "third", "quarter"];

type WidthMode = "uniform" | "perBreakpoint";
const MODES: { value: WidthMode; label: string }[] = [
  { value: "uniform", label: C.uniform },
  { value: "perBreakpoint", label: C.perBreakpoint },
];

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
    <div className="flex flex-col gap-[1.068vw] tablet:gap-[0.5vw] desktop:gap-[0.208vw]">
      <span className="text-[2.937vw] tablet:text-[1.375vw] desktop:text-[0.572vw] text-muted-foreground">
        {label}
      </span>
      <Select
        value={value ?? NONE_VALUE}
        onValueChange={(v) =>
          onChange(v === NONE_VALUE ? undefined : (v as FieldWidth))
        }
      >
        <SelectTrigger aria-label={label} className="w-full">
          <SelectValue placeholder={C.selectPlaceholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE_VALUE}>{C.fullDefault}</SelectItem>
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
export function WidthEditor({
  id,
  value,
  onChange,
}: ControlProps<ResponsiveFieldWidth>) {
  const isObject = typeof value === "object" && value !== null;
  const uniform = typeof value === "string" ? value : undefined;
  const obj = isObject ? value : {};

  const setMode = (perBreakpoint: boolean) => {
    // Seed an (empty) object even at the default width so the toggle actually
    // switches modes; the object form resolves to full when a breakpoint is unset.
    if (perBreakpoint) onChange(uniform ? { mobile: uniform } : {});
    else onChange(isObject ? value.mobile : undefined);
  };

  const patchBreakpoint = (
    bp: "mobile" | "tablet" | "desktop",
    w: FieldWidth | undefined,
  ) => {
    const next = { ...obj, [bp]: w };
    if (w === undefined) delete next[bp];
    onChange(Object.keys(next).length ? next : undefined);
  };

  return (
    <div
      id={id}
      className="flex flex-col gap-[2.136vw] tablet:gap-[1vw] desktop:gap-[0.416vw]"
    >
      <SegmentedControl
        aria-label={C.modeAriaLabel}
        options={MODES}
        value={isObject ? "perBreakpoint" : "uniform"}
        onChange={(mode) => setMode(mode === "perBreakpoint")}
      />

      {isObject ? (
        <div className="grid grid-cols-3 gap-[1.602vw] tablet:gap-[0.75vw] desktop:gap-[0.312vw]">
          <WidthSelect
            label={C.mobile}
            value={value.mobile}
            onChange={(w) => patchBreakpoint("mobile", w)}
          />
          <WidthSelect
            label={C.tablet}
            value={value.tablet}
            onChange={(w) => patchBreakpoint("tablet", w)}
          />
          <WidthSelect
            label={C.desktop}
            value={value.desktop}
            onChange={(w) => patchBreakpoint("desktop", w)}
          />
        </div>
      ) : (
        <WidthSelect
          label={C.widthLabel}
          value={uniform}
          onChange={(w) => onChange(w)}
        />
      )}
    </div>
  );
}
