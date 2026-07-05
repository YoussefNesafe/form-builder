import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-[32px] tablet:h-[32px] desktop:h-[32px] w-full min-w-0 rounded-[10px] tablet:rounded-[10px] desktop:rounded-[10px] border border-input bg-transparent px-[10px] tablet:px-[10px] desktop:px-[10px] py-[4px] tablet:py-[4px] desktop:py-[4px] text-[16px] tablet:text-[14px] desktop:text-[14px] transition-colors outline-none file:inline-flex file:h-[24px] tablet:file:h-[24px] desktop:file:h-[24px] file:border-0 file:bg-transparent file:text-[14px] tablet:file:text-[14px] desktop:file:text-[14px] file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 tablet:focus-visible:ring-3 desktop:focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 tablet:aria-invalid:ring-3 desktop:aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Input }
