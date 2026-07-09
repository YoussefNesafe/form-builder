"use client";

import { useId } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FieldComponentProps } from "../core/registry";
import type { FieldConfig } from "../core/types";
import { useFieldDisabled, useFieldRuntime } from "../components/FieldRuntime";
import { FieldWrapper, fieldAriaDescribedBy } from "../ui/FieldWrapper";

type RatingFieldConfig = Extract<FieldConfig, { type: "rating" }>;

export function RatingField({ field }: FieldComponentProps) {
  const config = field as RatingFieldConfig;
  const { control } = useFormContext();
  const disabled = useFieldDisabled(config);
  const { messages } = useFieldRuntime();
  const id = useId();
  const max = config.max ?? 5;

  return (
    <Controller
      name={config.name}
      control={control}
      render={({ field: rhf, fieldState }) => {
        const value = typeof rhf.value === "number" ? rhf.value : 0;

        const select = (next: number) => {
          if (disabled) return;
          // Re-clicking the current value clears an optional rating.
          if (next === value && !config.required) rhf.onChange(undefined);
          else rhf.onChange(next);
        };

        const onKeyDown = (event: React.KeyboardEvent) => {
          if (disabled) return;
          const step =
            event.key === "ArrowRight" || event.key === "ArrowUp"
              ? 1
              : event.key === "ArrowLeft" || event.key === "ArrowDown"
                ? -1
                : 0;
          if (step === 0) return;
          event.preventDefault();
          rhf.onChange(Math.min(max, Math.max(1, value + step)));
        };

        return (
          <FieldWrapper
            id={id}
            asGroup
            label={config.label}
            description={config.description}
            required={config.required}
            disabled={disabled}
            error={fieldState.error}
          >
            <div
              role="radiogroup"
              aria-describedby={fieldAriaDescribedBy(id, {
                description: config.description,
                error: fieldState.error,
              })}
              onKeyDown={onKeyDown}
              onBlur={rhf.onBlur}
              className="flex items-center gap-[4px] tablet:gap-[4px] desktop:gap-[4px]"
            >
              {Array.from({ length: max }, (_, index) => {
                const starValue = index + 1;
                const checked = starValue === value;
                return (
                  <button
                    key={starValue}
                    ref={starValue === 1 ? rhf.ref : undefined}
                    type="button"
                    role="radio"
                    aria-checked={checked}
                    aria-label={messages.ratingValue(starValue, max)}
                    disabled={disabled}
                    // Roving tabindex: the selected star is the tab stop; with
                    // no selection the first star is.
                    tabIndex={checked || (value === 0 && starValue === 1) ? 0 : -1}
                    onClick={() => select(starValue)}
                    // Flat mandate: focus state via border color only.
                    className={cn(
                      "border border-transparent focus-visible:outline-none focus-visible:border-primary disabled:opacity-50",
                      "p-[2px] tablet:p-[2px] desktop:p-[2px]",
                    )}
                  >
                    <Star
                      aria-hidden
                      className={cn(
                        "size-[24px] tablet:size-[24px] desktop:size-[24px]",
                        starValue <= value ? "fill-primary text-primary" : "text-muted-foreground",
                      )}
                    />
                  </button>
                );
              })}
            </div>
          </FieldWrapper>
        );
      }}
    />
  );
}
