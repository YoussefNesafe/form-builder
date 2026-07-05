"use client"

import * as React from "react"
import { Select as SelectPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"
import { ChevronDownIcon, CheckIcon, ChevronUpIcon } from "lucide-react"

function Select({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Root>) {
  return <SelectPrimitive.Root data-slot="select" {...props} />
}

function SelectGroup({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Group>) {
  return (
    <SelectPrimitive.Group
      data-slot="select-group"
      className={cn("scroll-my-[4px] tablet:scroll-my-[4px] desktop:scroll-my-[4px] p-[4px] tablet:p-[4px] desktop:p-[4px]", className)}
      {...props}
    />
  )
}

function SelectValue({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Value>) {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />
}

function SelectTrigger({
  className,
  size = "default",
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger> & {
  size?: "sm" | "default"
}) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        "flex w-fit items-center justify-between gap-[6px] tablet:gap-[6px] desktop:gap-[6px] rounded-[10px] tablet:rounded-[10px] desktop:rounded-[10px] border border-input bg-transparent py-[8px] tablet:py-[8px] desktop:py-[8px] pe-[8px] tablet:pe-[8px] desktop:pe-[8px] ps-[10px] tablet:ps-[10px] desktop:ps-[10px] text-[14px] tablet:text-[14px] desktop:text-[14px] whitespace-nowrap transition-colors outline-none select-none focus-visible:border-ring focus-visible:ring-3 tablet:focus-visible:ring-3 desktop:focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 tablet:aria-invalid:ring-3 desktop:aria-invalid:ring-3 aria-invalid:ring-destructive/20 data-placeholder:text-muted-foreground data-[size=default]:h-[32px] tablet:data-[size=default]:h-[32px] desktop:data-[size=default]:h-[32px] data-[size=sm]:h-[28px] tablet:data-[size=sm]:h-[28px] desktop:data-[size=sm]:h-[28px] data-[size=sm]:rounded-[8px] tablet:data-[size=sm]:rounded-[8px] desktop:data-[size=sm]:rounded-[8px] *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-[6px] tablet:*:data-[slot=select-value]:gap-[6px] desktop:*:data-[slot=select-value]:gap-[6px] dark:bg-input/30 dark:hover:bg-input/50 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-[16px] tablet:[&_svg:not([class*='size-'])]:size-[16px] desktop:[&_svg:not([class*='size-'])]:size-[16px]",
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDownIcon className="pointer-events-none size-[16px] tablet:size-[16px] desktop:size-[16px] text-muted-foreground" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}

function SelectContent({
  className,
  children,
  position = "item-aligned",
  align = "center",
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot="select-content"
        data-align-trigger={position === "item-aligned"}
        className={cn("relative z-50 max-h-(--radix-select-content-available-height) min-w-[144px] tablet:min-w-[144px] desktop:min-w-[144px] origin-(--radix-select-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-[10px] tablet:rounded-[10px] desktop:rounded-[10px] bg-popover text-popover-foreground shadow-md ring-1 tablet:ring-1 desktop:ring-1 ring-foreground/10 duration-100 data-[align-trigger=true]:animate-none data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95", position ==="popper"&&"data-[side=bottom]:translate-y-[4px] tablet:data-[side=bottom]:translate-y-[4px] desktop:data-[side=bottom]:translate-y-[4px] data-[side=left]:-translate-x-[4px] tablet:data-[side=left]:-translate-x-[4px] desktop:data-[side=left]:-translate-x-[4px] rtl:data-[side=left]:translate-x-[4px] tablet:rtl:data-[side=left]:translate-x-[4px] desktop:rtl:data-[side=left]:translate-x-[4px] data-[side=right]:translate-x-[4px] tablet:data-[side=right]:translate-x-[4px] desktop:data-[side=right]:translate-x-[4px] rtl:data-[side=right]:-translate-x-[4px] tablet:rtl:data-[side=right]:-translate-x-[4px] desktop:rtl:data-[side=right]:-translate-x-[4px] data-[side=top]:-translate-y-[4px] tablet:data-[side=top]:-translate-y-[4px] desktop:data-[side=top]:-translate-y-[4px]", className )}
        position={position}
        align={align}
        {...props}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport
          data-position={position}
          className={cn(
            "data-[position=popper]:h-(--radix-select-trigger-height) data-[position=popper]:w-full data-[position=popper]:min-w-(--radix-select-trigger-width)",
            position === "popper" && ""
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
}

function SelectLabel({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Label>) {
  return (
    <SelectPrimitive.Label
      data-slot="select-label"
      className={cn("px-[6px] tablet:px-[6px] desktop:px-[6px] py-[4px] tablet:py-[4px] desktop:py-[4px] text-[12px] tablet:text-[12px] desktop:text-[12px] text-muted-foreground", className)}
      {...props}
    />
  )
}

function SelectItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "relative flex w-full cursor-default items-center gap-[6px] tablet:gap-[6px] desktop:gap-[6px] rounded-[8px] tablet:rounded-[8px] desktop:rounded-[8px] py-[4px] tablet:py-[4px] desktop:py-[4px] pe-[32px] tablet:pe-[32px] desktop:pe-[32px] ps-[6px] tablet:ps-[6px] desktop:ps-[6px] text-[14px] tablet:text-[14px] desktop:text-[14px] outline-hidden select-none focus:bg-accent focus:text-accent-foreground not-data-[variant=destructive]:focus:**:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-[16px] tablet:[&_svg:not([class*='size-'])]:size-[16px] desktop:[&_svg:not([class*='size-'])]:size-[16px] *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-[8px] tablet:*:[span]:last:gap-[8px] desktop:*:[span]:last:gap-[8px]",
        className
      )}
      {...props}
    >
      <span className="pointer-events-none absolute end-[8px] tablet:end-[8px] desktop:end-[8px] flex size-[16px] tablet:size-[16px] desktop:size-[16px] items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <CheckIcon className="pointer-events-none" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
}

function SelectSeparator({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Separator>) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn("pointer-events-none -mx-[4px] tablet:-mx-[4px] desktop:-mx-[4px] my-[4px] tablet:my-[4px] desktop:my-[4px] h-px bg-border", className)}
      {...props}
    />
  )
}

function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton>) {
  return (
    <SelectPrimitive.ScrollUpButton
      data-slot="select-scroll-up-button"
      className={cn(
        "z-10 flex cursor-default items-center justify-center bg-popover py-[4px] tablet:py-[4px] desktop:py-[4px] [&_svg:not([class*='size-'])]:size-[16px] tablet:[&_svg:not([class*='size-'])]:size-[16px] desktop:[&_svg:not([class*='size-'])]:size-[16px]",
        className
      )}
      {...props}
    >
      <ChevronUpIcon
      />
    </SelectPrimitive.ScrollUpButton>
  )
}

function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownButton>) {
  return (
    <SelectPrimitive.ScrollDownButton
      data-slot="select-scroll-down-button"
      className={cn(
        "z-10 flex cursor-default items-center justify-center bg-popover py-[4px] tablet:py-[4px] desktop:py-[4px] [&_svg:not([class*='size-'])]:size-[16px] tablet:[&_svg:not([class*='size-'])]:size-[16px] desktop:[&_svg:not([class*='size-'])]:size-[16px]",
        className
      )}
      {...props}
    >
      <ChevronDownIcon
      />
    </SelectPrimitive.ScrollDownButton>
  )
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
}
