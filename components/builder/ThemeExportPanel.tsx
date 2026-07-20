"use client";

import { useMemo, useState } from "react";
import { Check, Copy, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { builder } from "@/locales/en/builder";
import { fmt } from "@/locales/fmt";
import {
  generateThemeCss,
  THEME_DEFAULTS,
  type ThemeUnit,
} from "./model/themeCss";

const COPIED_RESET_MS = 1500;

const UNITS: { value: ThemeUnit; label: string }[] = [
  { value: "vw", label: "vw" },
  { value: "px", label: "px" },
  { value: "rem", label: "rem" },
  { value: "em", label: "em" },
];

function toNum(text: string, fallback: number): number {
  const n = Number(text);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function downloadCss(text: string) {
  const blob = new Blob([text], { type: "text/css" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "tokens.css";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function ThemeExportPanel() {
  const [unit, setUnit] = useState<ThemeUnit>("vw");
  const [base, setBase] = useState(String(THEME_DEFAULTS.base));
  const [refMobile, setRefMobile] = useState(String(THEME_DEFAULTS.refMobile));
  const [refTablet, setRefTablet] = useState(String(THEME_DEFAULTS.refTablet));
  const [refDesktop, setRefDesktop] = useState(String(THEME_DEFAULTS.refDesktop));
  const [copied, setCopied] = useState(false);

  const isFixed = unit !== "vw";
  const needsBase = unit === "rem" || unit === "em";

  const css = useMemo(
    () =>
      generateThemeCss({
        unit,
        base: toNum(base, THEME_DEFAULTS.base),
        refMobile: toNum(refMobile, THEME_DEFAULTS.refMobile),
        refTablet: toNum(refTablet, THEME_DEFAULTS.refTablet),
        refDesktop: toNum(refDesktop, THEME_DEFAULTS.refDesktop),
      }),
    [unit, base, refMobile, refTablet, refDesktop],
  );

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(css);
      setCopied(true);
      setTimeout(() => setCopied(false), COPIED_RESET_MS);
    } catch {
    }
  };

  const numberField = (
    id: string,
    label: string,
    value: string,
    onChange: (v: string) => void,
    fallback: number,
  ) => (
    <div className="flex flex-col gap-[1.068vw] tablet:gap-[0.5vw] desktop:gap-[0.208vw]">
      <Label
        htmlFor={id}
        className="text-[2.937vw] tablet:text-[1.375vw] desktop:text-[0.572vw] text-muted-foreground"
      >
        {label}
      </Label>
      <Input
        id={id}
        type="number"
        inputMode="numeric"
        min={1}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={String(fallback)}
        aria-describedby="theme-fixed-note"
        className="w-[25.62vw] tablet:w-[12vw] desktop:w-[4.992vw]"
      />
    </div>
  );

  return (
    <div className="flex min-h-0 min-w-0 flex-col gap-[3.204vw] tablet:gap-[1.5vw] desktop:gap-[0.624vw]">
      <div className="flex flex-col gap-[2.136vw] tablet:flex-row tablet:items-center tablet:justify-between tablet:gap-[1vw] desktop:gap-[0.416vw]">
        <SegmentedControl
          aria-label={builder.theme.unitAriaLabel}
          options={UNITS}
          value={unit}
          onChange={setUnit}
        />
        <div className="flex items-center gap-[2.136vw] tablet:gap-[1vw] desktop:gap-[0.416vw]">
          <Button variant="outline" size="sm" onClick={copy}>
            {copied ? <Check /> : <Copy />}
            {copied ? builder.theme.copied : builder.theme.copy}
          </Button>
          <Button variant="default" size="sm" onClick={() => downloadCss(css)}>
            <Download />
            {builder.theme.download}
          </Button>
        </div>
      </div>

      {isFixed && (
        <div className="flex flex-col gap-[2.136vw] tablet:gap-[1vw] desktop:gap-[0.416vw]">
          <div className="flex flex-wrap items-end gap-[3.204vw] tablet:gap-[1.5vw] desktop:gap-[0.624vw]">
            {numberField(
              "theme-ref-mobile",
              builder.theme.refMobile,
              refMobile,
              setRefMobile,
              THEME_DEFAULTS.refMobile,
            )}
            {numberField(
              "theme-ref-tablet",
              builder.theme.refTablet,
              refTablet,
              setRefTablet,
              THEME_DEFAULTS.refTablet,
            )}
            {numberField(
              "theme-ref-desktop",
              builder.theme.refDesktop,
              refDesktop,
              setRefDesktop,
              THEME_DEFAULTS.refDesktop,
            )}
            {needsBase &&
              numberField(
                "theme-base",
                fmt(builder.theme.baseSuffix, { unit }),
                base,
                setBase,
                THEME_DEFAULTS.base,
              )}
          </div>
        </div>
      )}

      <p
        id="theme-fixed-note"
        className="text-[2.937vw] tablet:text-[1.375vw] desktop:text-[0.572vw] text-muted-foreground"
      >
        {isFixed ? builder.theme.fixedNote : builder.theme.fluidNote}
      </p>

      <pre
        dir="ltr"
        className="w-full min-w-0 max-h-[112.14vw] tablet:max-h-[52.5vw] desktop:max-h-[21.84vw] overflow-y-auto whitespace-pre-wrap [overflow-wrap:anywhere] rounded-[2.67vw] tablet:rounded-[1.25vw] desktop:rounded-[0.52vw] border border-border bg-muted p-[3.204vw] tablet:p-[1.5vw] desktop:p-[0.624vw] text-[3.204vw] tablet:text-[1.5vw] desktop:text-[0.624vw]"
      >
        {css}
      </pre>
    </div>
  );
}
