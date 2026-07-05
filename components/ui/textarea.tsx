import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-[64px] tablet:min-h-[64px] desktop:min-h-[64px] w-full rounded-[10px] tablet:rounded-[10px] desktop:rounded-[10px] border border-input bg-transparent px-[10px] tablet:px-[10px] desktop:px-[10px] py-[8px] tablet:py-[8px] desktop:py-[8px] text-[16px] tablet:text-[14px] desktop:text-[14px] transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 tablet:focus-visible:ring-3 desktop:focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 tablet:aria-invalid:ring-3 desktop:aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
