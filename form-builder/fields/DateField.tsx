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

function parseIso(value: string | undefined): Date | undefined {
  if (!value) return undefined;
  const time = Date.parse(value);
  return Number.isNaN(time) ? undefined : new Date(time);
}

function dayMatcher(config: DateFieldConfig): Matcher[] | undefined {
  const min = parseIso(config.minDate);
  const max = parseIso(config.maxDate);
  const matchers: Matcher[] = [...(min ? [{ before: min }] : []), ...(max ? [{ after: max }] : [])];
  return matchers.length ? matchers : undefined;
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
                    selected={(() => {
                      const range = (rhf.value as IsoRange | undefined) ?? {};
                      const from = parseIso(range.from);
                      return from ? ({ from, to: parseIso(range.to) } satisfies DateRange) : undefined;
                    })()}
                    onSelect={(range) => {
                      rhf.onChange(
                        range?.from
                          ? { from: range.from.toISOString(), ...(range.to && { to: range.to.toISOString() }) }
                          : undefined,
                      );
                      if (range?.from && range?.to) setOpen(false);
                    }}
                    disabled={dayMatcher(config)}
                  />
                ) : (
                  <Calendar
                    mode="single"
                    selected={parseIso(rhf.value as string | undefined)}
                    onSelect={(date) => {
                      rhf.onChange(date ? date.toISOString() : undefined);
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
