"use client"

import * as React from "react"
import { RadioGroup as RadioGroupPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

export type SegmentedControlOption<T extends string> = {
  value: T
  label: React.ReactNode
}

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
        "flex items-center gap-[1.068vw] tablet:gap-[0.5vw] desktop:gap-[0.208vw] rounded-[2.67vw] tablet:rounded-[1.25vw] desktop:rounded-[0.52vw] border border-border p-[0.534vw] tablet:p-[0.25vw] desktop:p-[0.104vw]",
        className
      )}
    >
      {options.map((option) => (
        <RadioGroupPrimitive.Item
          key={option.value}
          value={option.value}
          className={cn(
            "rounded-[2.136vw] tablet:rounded-[1vw] desktop:rounded-[0.416vw] px-[2.67vw] tablet:px-[1.25vw] desktop:px-[0.52vw] py-[1.068vw] tablet:py-[0.5vw] desktop:py-[0.208vw] text-[3.471vw] tablet:text-[1.625vw] desktop:text-[0.676vw]",
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
