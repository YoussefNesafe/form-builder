import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// Flat callout box (border-color state, no shadow/ring — matches the repo's
// flat style). Radius is normalized to 12px across call sites; callers still
// own their own padding/gap/typography via `className` since those vary by
// context (a two-line title+description card vs. a single-line inline note).
const alertVariants = cva(
  "rounded-[12px] tablet:rounded-[12px] desktop:rounded-[12px] border text-[12px] tablet:text-[12px] desktop:text-[12px]",
  {
    variants: {
      variant: {
        destructive: "border-destructive/40 bg-destructive/10 text-destructive",
      },
    },
    defaultVariants: {
      variant: "destructive",
    },
  }
)

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      className={cn(alertVariants({ variant, className }))}
      {...props}
    />
  )
}

export { Alert, alertVariants }
