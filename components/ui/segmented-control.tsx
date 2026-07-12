"use client"

import * as React from "react"
import { RadioGroup as RadioGroupPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

export type SegmentedControlOption<T extends string> = {
  value: T
  label: React.ReactNode
}

/**
 * Minimal radiogroup-semantics segmented control: a bordered container of
 * buttons, one active at a time. Built on the Radix RadioGroup primitive (the
 * same one `components/ui/radio-group.tsx` wraps, and the engine's own
 * segmented field uses) so it gets roving tabindex + arrow-key selection for
 * free, instead of a hand-rolled `role="radio"` div with no keyboard contract.
 * Flat style — active state is a background fill, not a shadow/ring.
 */
function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
  "aria-label": ariaLabel,
}: {
  options: SegmentedControlOption<T>[]
  value: T
  onChange: (value: T) => void
  className?: string
  "aria-label"?: string
}) {
  return (
    <RadioGroupPrimitive.Root
      value={value}
      onValueChange={(v) => onChange(v as T)}
      aria-label={ariaLabel}
      className={cn(
        "flex items-center gap-[4px] tablet:gap-[4px] desktop:gap-[4px] rounded-[10px] tablet:rounded-[10px] desktop:rounded-[10px] border border-border p-[2px] tablet:p-[2px] desktop:p-[2px]",
        className
      )}
    >
      {options.map((option) => (
        <RadioGroupPrimitive.Item
          key={option.value}
          value={option.value}
          className={cn(
            "rounded-[8px] tablet:rounded-[8px] desktop:rounded-[8px] px-[10px] tablet:px-[10px] desktop:px-[10px] py-[4px] tablet:py-[4px] desktop:py-[4px] text-[13px] tablet:text-[13px] desktop:text-[13px]",
            value === option.value ? "bg-muted text-foreground" : "text-muted-foreground"
          )}
        >
          {option.label}
        </RadioGroupPrimitive.Item>
      ))}
    </RadioGroupPrimitive.Root>
  )
}

export { SegmentedControl }
