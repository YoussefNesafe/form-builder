"use client";

import { useId, useState } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import type { DateRange, Matcher } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { FieldComponentProps } from "../core/registry";
import type { FieldConfig } from "../core/types";
import { useFieldDisabled } from "../components/FieldRuntime";
import { FieldWrapper, fieldAriaDescribedBy } from "../ui/FieldWrapper";

type DateFieldConfig = Extract<FieldConfig, { type: "date" }>;

type IsoRange = { from?: string; to?: string };

// Values are calendar dates ("yyyy-MM-dd"), never instants. Parsing via
// Date.parse would read them as UTC midnight and shift the day in any
// non-UTC timezone — construct local dates from the parts instead.
function parseIso(value: string | undefined): Date | undefined {
  if (!value) return undefined;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return undefined;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

function toDateString(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

function dayMatcher(config: DateFieldConfig): Matcher[] | undefined {
  const min = parseIso(config.minDate);
  const max = parseIso(config.maxDate);
  const matchers: Matcher[] = [...(min ? [{ before: min }] : []), ...(max ? [{ after: max }] : [])];
  return matchers.length ? matchers : undefined;
}

/**
 * Month/year dropdowns instead of endless prev/next clicks — a birthday field
 * with maxDate would otherwise need hundreds of navigation clicks.
 */
function calendarNavigation(config: DateFieldConfig) {
  const min = parseIso(config.minDate);
  const max = parseIso(config.maxDate);
  const now = new Date();
  return {
    captionLayout: "dropdown" as const,
    startMonth: min ?? new Date(now.getFullYear() - 100, 0),
    endMonth: max ?? new Date(now.getFullYear() + 10, 11),
    defaultMonth: max && max < now ? max : undefined,
  };
}

export function DateField({ field }: FieldComponentProps) {
  const config = field as DateFieldConfig;
  const { control } = useFormContext();
  const disabled = useFieldDisabled(config);
  const id = useId();
  const [open, setOpen] = useState(false);

  return (
    <Controller
      name={config.name}
      control={control}
      render={({ field: rhf, fieldState }) => {
        const label = config.range
          ? (() => {
              const range = (rhf.value as IsoRange | undefined) ?? {};
              const from = parseIso(range.from);
              const to = parseIso(range.to);
              if (from && to) return `${format(from, "PP")} – ${format(to, "PP")}`;
              if (from) return `${format(from, "PP")} – …`;
              return config.placeholder ?? "";
            })()
          : (() => {
              const date = parseIso(rhf.value as string | undefined);
              return date ? format(date, "PP") : (config.placeholder ?? "");
            })();

        return (
          <FieldWrapper
            id={id}
            label={config.label}
            description={config.description}
            required={config.required}
            disabled={disabled}
            error={fieldState.error}
          >
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  id={id}
                  type="button"
                  variant="outline"
                  disabled={disabled}
                  aria-invalid={!!fieldState.error}
                  aria-describedby={fieldAriaDescribedBy(id, {
                    description: config.description,
                    error: fieldState.error,
                  })}
                  onBlur={rhf.onBlur}
                  className={cn("w-full justify-start font-normal", !label && "text-muted-foreground")}
                >
                  <CalendarIcon className="me-2 size-4" />
                  {label || "…"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                {config.range ? (
                  <Calendar
                    mode="range"
                    {...calendarNavigation(config)}
                    selected={(() => {
                      const range = (rhf.value as IsoRange | undefined) ?? {};
                      const from = parseIso(range.from);
                      return from ? ({ from, to: parseIso(range.to) } satisfies DateRange) : undefined;
                    })()}
                    onSelect={(range) => {
                      rhf.onChange(
                        range?.from
                          ? { from: toDateString(range.from), ...(range.to && { to: toDateString(range.to) }) }
                          : undefined,
                      );
                      if (range?.from && range?.to) setOpen(false);
                    }}
                    disabled={dayMatcher(config)}
                  />
                ) : (
                  <Calendar
                    mode="single"
                    {...calendarNavigation(config)}
                    selected={parseIso(rhf.value as string | undefined)}
                    onSelect={(date) => {
                      rhf.onChange(date ? toDateString(date) : undefined);
                      setOpen(false);
                    }}
                    disabled={dayMatcher(config)}
                  />
                )}
              </PopoverContent>
            </Popover>
          </FieldWrapper>
        );
      }}
    />
  );
}
