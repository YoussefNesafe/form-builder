"use client";

import { useId, useRef } from "react";
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
  const starRefs = useRef<(HTMLButtonElement | null)[]>([]);

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
          // From no selection any arrow lands on 1 star — intentional (native
          // radios would pick last on Left/Up, but "first press = 1 star" is
          // the less surprising rating behavior).
          const next = Math.min(max, Math.max(1, value + step));
          rhf.onChange(next);
          // Roving tabindex: focus follows selection, so the focus border and
          // aria-checked announcement stay on the same star.
          starRefs.current[next - 1]?.focus();
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
              className="flex items-center gap-[1.068vw] tablet:gap-[0.5vw] desktop:gap-[0.208vw]"
            >
              {Array.from({ length: max }, (_, index) => {
                const starValue = index + 1;
                const checked = starValue === value;
                return (
                  <button
                    key={starValue}
                    ref={(element) => {
                      starRefs.current[index] = element;
                      if (starValue === 1) rhf.ref(element);
                    }}
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
                      "p-[0.534vw] tablet:p-[0.25vw] desktop:p-[0.104vw]",
                    )}
                  >
                    <Star
                      aria-hidden
                      className={cn(
                        "size-[6.408vw] tablet:size-[3vw] desktop:size-[1.248vw]",
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
