"use client"

import * as React from "react"
import { Slider as SliderPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  ...props
}: React.ComponentProps<typeof SliderPrimitive.Root>) {
  const _values = React.useMemo(
    () =>
      Array.isArray(value)
        ? value
        : Array.isArray(defaultValue)
          ? defaultValue
          : [min, max],
    [value, defaultValue, min, max]
  )

  return (
    <SliderPrimitive.Root
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      className={cn(
        "relative flex w-full touch-none items-center select-none data-disabled:opacity-50 data-vertical:h-full data-vertical:min-h-[160px] tablet:data-vertical:min-h-[160px] desktop:data-vertical:min-h-[160px] data-vertical:w-auto data-vertical:flex-col",
        className
      )}
      {...props}
    >
      <SliderPrimitive.Track
        data-slot="slider-track"
        className="relative grow overflow-hidden rounded-full bg-muted data-horizontal:h-[4px] tablet:data-horizontal:h-[4px] desktop:data-horizontal:h-[4px] data-horizontal:w-full data-vertical:h-full data-vertical:w-[4px] tablet:data-vertical:w-[4px] desktop:data-vertical:w-[4px]"
      >
        <SliderPrimitive.Range
          data-slot="slider-range"
          className="absolute bg-primary select-none data-horizontal:h-full data-vertical:w-full"
        />
      </SliderPrimitive.Track>
      {Array.from({ length: _values.length }, (_, index) => (
        <SliderPrimitive.Thumb
          data-slot="slider-thumb"
          key={index}
          className="relative block size-[12px] tablet:size-[12px] desktop:size-[12px] shrink-0 rounded-full border border-ring bg-white ring-ring/50 transition-[color,box-shadow] select-none after:absolute after:-inset-[8px] tablet:after:-inset-[8px] desktop:after:-inset-[8px] hover:ring-3 tablet:hover:ring-3 desktop:hover:ring-3 focus-visible:ring-3 tablet:focus-visible:ring-3 desktop:focus-visible:ring-3 focus-visible:outline-hidden active:ring-3 tablet:active:ring-3 desktop:active:ring-3 disabled:pointer-events-none disabled:opacity-50"
        />
      ))}
    </SliderPrimitive.Root>
  )
}

export { Slider }
