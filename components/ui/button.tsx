import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-[10px] tablet:rounded-[10px] desktop:rounded-[10px] border border-transparent bg-clip-padding text-[14px] tablet:text-[14px] desktop:text-[14px] font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 tablet:focus-visible:ring-3 desktop:focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 tablet:aria-invalid:ring-3 desktop:aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-[16px] tablet:[&_svg:not([class*='size-'])]:size-[16px] desktop:[&_svg:not([class*='size-'])]:size-[16px]",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/80",
        outline:
          "border-border bg-background hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)] aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost:
          "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-[32px] tablet:h-[32px] desktop:h-[32px] gap-[6px] tablet:gap-[6px] desktop:gap-[6px] px-[10px] tablet:px-[10px] desktop:px-[10px] has-data-[icon=inline-end]:pe-[8px] tablet:has-data-[icon=inline-end]:pe-[8px] desktop:has-data-[icon=inline-end]:pe-[8px] has-data-[icon=inline-start]:ps-[8px] tablet:has-data-[icon=inline-start]:ps-[8px] desktop:has-data-[icon=inline-start]:ps-[8px]",
        xs: "h-[24px] tablet:h-[24px] desktop:h-[24px] gap-[4px] tablet:gap-[4px] desktop:gap-[4px] rounded-[8px] tablet:rounded-[8px] desktop:rounded-[8px] px-[8px] tablet:px-[8px] desktop:px-[8px] text-[12px] tablet:text-[12px] desktop:text-[12px] in-data-[slot=button-group]:rounded-[10px] tablet:in-data-[slot=button-group]:rounded-[10px] desktop:in-data-[slot=button-group]:rounded-[10px] has-data-[icon=inline-end]:pe-[6px] tablet:has-data-[icon=inline-end]:pe-[6px] desktop:has-data-[icon=inline-end]:pe-[6px] has-data-[icon=inline-start]:ps-[6px] tablet:has-data-[icon=inline-start]:ps-[6px] desktop:has-data-[icon=inline-start]:ps-[6px] [&_svg:not([class*='size-'])]:size-[12px] tablet:[&_svg:not([class*='size-'])]:size-[12px] desktop:[&_svg:not([class*='size-'])]:size-[12px]",
        sm: "h-[28px] tablet:h-[28px] desktop:h-[28px] gap-[4px] tablet:gap-[4px] desktop:gap-[4px] rounded-[8px] tablet:rounded-[8px] desktop:rounded-[8px] px-[10px] tablet:px-[10px] desktop:px-[10px] text-[12.8px] tablet:text-[12.8px] desktop:text-[12.8px] in-data-[slot=button-group]:rounded-[10px] tablet:in-data-[slot=button-group]:rounded-[10px] desktop:in-data-[slot=button-group]:rounded-[10px] has-data-[icon=inline-end]:pe-[6px] tablet:has-data-[icon=inline-end]:pe-[6px] desktop:has-data-[icon=inline-end]:pe-[6px] has-data-[icon=inline-start]:ps-[6px] tablet:has-data-[icon=inline-start]:ps-[6px] desktop:has-data-[icon=inline-start]:ps-[6px] [&_svg:not([class*='size-'])]:size-[14px] tablet:[&_svg:not([class*='size-'])]:size-[14px] desktop:[&_svg:not([class*='size-'])]:size-[14px]",
        lg: "h-[36px] tablet:h-[36px] desktop:h-[36px] gap-[6px] tablet:gap-[6px] desktop:gap-[6px] px-[10px] tablet:px-[10px] desktop:px-[10px] has-data-[icon=inline-end]:pe-[8px] tablet:has-data-[icon=inline-end]:pe-[8px] desktop:has-data-[icon=inline-end]:pe-[8px] has-data-[icon=inline-start]:ps-[8px] tablet:has-data-[icon=inline-start]:ps-[8px] desktop:has-data-[icon=inline-start]:ps-[8px]",
        icon: "size-[32px] tablet:size-[32px] desktop:size-[32px]",
        "icon-xs":
          "size-[24px] tablet:size-[24px] desktop:size-[24px] rounded-[8px] tablet:rounded-[8px] desktop:rounded-[8px] in-data-[slot=button-group]:rounded-[10px] tablet:in-data-[slot=button-group]:rounded-[10px] desktop:in-data-[slot=button-group]:rounded-[10px] [&_svg:not([class*='size-'])]:size-[12px] tablet:[&_svg:not([class*='size-'])]:size-[12px] desktop:[&_svg:not([class*='size-'])]:size-[12px]",
        "icon-sm":
          "size-[28px] tablet:size-[28px] desktop:size-[28px] rounded-[8px] tablet:rounded-[8px] desktop:rounded-[8px] in-data-[slot=button-group]:rounded-[10px] tablet:in-data-[slot=button-group]:rounded-[10px] desktop:in-data-[slot=button-group]:rounded-[10px]",
        "icon-lg": "size-[36px] tablet:size-[36px] desktop:size-[36px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
