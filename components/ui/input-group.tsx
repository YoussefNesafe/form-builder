"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

function InputGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="input-group"
      role="group"
      className={cn(
        "group/input-group relative flex h-[32px] tablet:h-[32px] desktop:h-[32px] w-full min-w-0 items-center rounded-[10px] tablet:rounded-[10px] desktop:rounded-[10px] border border-input transition-colors outline-none in-data-[slot=combobox-content]:focus-within:border-inherit in-data-[slot=combobox-content]:focus-within:ring-0 has-disabled:bg-input/50 has-disabled:opacity-50 has-[[data-slot=input-group-control]:focus-visible]:border-ring has-[[data-slot=input-group-control]:focus-visible]:ring-3 tablet:has-[[data-slot=input-group-control]:focus-visible]:ring-3 desktop:has-[[data-slot=input-group-control]:focus-visible]:ring-3 has-[[data-slot=input-group-control]:focus-visible]:ring-ring/50 has-[[data-slot][aria-invalid=true]]:border-destructive has-[[data-slot][aria-invalid=true]]:ring-3 tablet:has-[[data-slot][aria-invalid=true]]:ring-3 desktop:has-[[data-slot][aria-invalid=true]]:ring-3 has-[[data-slot][aria-invalid=true]]:ring-destructive/20 has-[>[data-align=block-end]]:h-auto has-[>[data-align=block-end]]:flex-col has-[>[data-align=block-start]]:h-auto has-[>[data-align=block-start]]:flex-col has-[>textarea]:h-auto dark:bg-input/30 dark:has-disabled:bg-input/80 dark:has-[[data-slot][aria-invalid=true]]:ring-destructive/40 has-[>[data-align=block-end]]:[&>input]:pt-[12px] tablet:has-[>[data-align=block-end]]:[&>input]:pt-[12px] desktop:has-[>[data-align=block-end]]:[&>input]:pt-[12px] has-[>[data-align=block-start]]:[&>input]:pb-[12px] tablet:has-[>[data-align=block-start]]:[&>input]:pb-[12px] desktop:has-[>[data-align=block-start]]:[&>input]:pb-[12px] has-[>[data-align=inline-end]]:[&>input]:pe-[6px] tablet:has-[>[data-align=inline-end]]:[&>input]:pe-[6px] desktop:has-[>[data-align=inline-end]]:[&>input]:pe-[6px] has-[>[data-align=inline-start]]:[&>input]:ps-[6px] tablet:has-[>[data-align=inline-start]]:[&>input]:ps-[6px] desktop:has-[>[data-align=inline-start]]:[&>input]:ps-[6px]",
        className
      )}
      {...props}
    />
  )
}

const inputGroupAddonVariants = cva(
  "flex h-auto cursor-text items-center justify-center gap-[8px] tablet:gap-[8px] desktop:gap-[8px] py-[6px] tablet:py-[6px] desktop:py-[6px] text-[14px] tablet:text-[14px] desktop:text-[14px] font-medium text-muted-foreground select-none group-data-[disabled=true]/input-group:opacity-50 [&>kbd]:rounded-[5px] tablet:[&>kbd]:rounded-[5px] desktop:[&>kbd]:rounded-[5px] [&>svg:not([class*='size-'])]:size-[16px] tablet:[&>svg:not([class*='size-'])]:size-[16px] desktop:[&>svg:not([class*='size-'])]:size-[16px]",
  {
    variants: {
      align: {
        "inline-start":
          "order-first ps-[8px] tablet:ps-[8px] desktop:ps-[8px] has-[>button]:ms-[-4.8px] tablet:has-[>button]:ms-[-4.8px] desktop:has-[>button]:ms-[-4.8px] has-[>kbd]:ms-[-2.4px] tablet:has-[>kbd]:ms-[-2.4px] desktop:has-[>kbd]:ms-[-2.4px]",
        "inline-end":
          "order-last pe-[8px] tablet:pe-[8px] desktop:pe-[8px] has-[>button]:me-[-4.8px] tablet:has-[>button]:me-[-4.8px] desktop:has-[>button]:me-[-4.8px] has-[>kbd]:me-[-2.4px] tablet:has-[>kbd]:me-[-2.4px] desktop:has-[>kbd]:me-[-2.4px]",
        "block-start":
          "order-first w-full justify-start px-[10px] tablet:px-[10px] desktop:px-[10px] pt-[8px] tablet:pt-[8px] desktop:pt-[8px] group-has-[>input]/input-group:pt-[8px] tablet:group-has-[>input]/input-group:pt-[8px] desktop:group-has-[>input]/input-group:pt-[8px] [.border-b]:pb-[8px] tablet:[.border-b]:pb-[8px] desktop:[.border-b]:pb-[8px]",
        "block-end":
          "order-last w-full justify-start px-[10px] tablet:px-[10px] desktop:px-[10px] pb-[8px] tablet:pb-[8px] desktop:pb-[8px] group-has-[>input]/input-group:pb-[8px] tablet:group-has-[>input]/input-group:pb-[8px] desktop:group-has-[>input]/input-group:pb-[8px] [.border-t]:pt-[8px] tablet:[.border-t]:pt-[8px] desktop:[.border-t]:pt-[8px]",
      },
    },
    defaultVariants: {
      align: "inline-start",
    },
  }
)

function InputGroupAddon({
  className,
  align = "inline-start",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof inputGroupAddonVariants>) {
  return (
    <div
      role="group"
      data-slot="input-group-addon"
      data-align={align}
      className={cn(inputGroupAddonVariants({ align }), className)}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("button")) {
          return
        }
        e.currentTarget.parentElement?.querySelector("input")?.focus()
      }}
      {...props}
    />
  )
}

const inputGroupButtonVariants = cva(
  "flex items-center gap-[8px] tablet:gap-[8px] desktop:gap-[8px] text-[14px] tablet:text-[14px] desktop:text-[14px] shadow-none",
  {
    variants: {
      size: {
        xs: "h-[24px] tablet:h-[24px] desktop:h-[24px] gap-[4px] tablet:gap-[4px] desktop:gap-[4px] rounded-[7px] tablet:rounded-[7px] desktop:rounded-[7px] px-[6px] tablet:px-[6px] desktop:px-[6px] [&>svg:not([class*='size-'])]:size-[14px] tablet:[&>svg:not([class*='size-'])]:size-[14px] desktop:[&>svg:not([class*='size-'])]:size-[14px]",
        sm: "",
        "icon-xs":
          "size-[24px] tablet:size-[24px] desktop:size-[24px] rounded-[7px] tablet:rounded-[7px] desktop:rounded-[7px] p-0 has-[>svg]:p-0",
        "icon-sm": "size-[32px] tablet:size-[32px] desktop:size-[32px] p-0 has-[>svg]:p-0",
      },
    },
    defaultVariants: {
      size: "xs",
    },
  }
)

function InputGroupButton({
  className,
  type = "button",
  variant = "ghost",
  size = "xs",
  ...props
}: Omit<React.ComponentProps<typeof Button>, "size"> &
  VariantProps<typeof inputGroupButtonVariants>) {
  return (
    <Button
      type={type}
      data-size={size}
      variant={variant}
      className={cn(inputGroupButtonVariants({ size }), className)}
      {...props}
    />
  )
}

function InputGroupText({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "flex items-center gap-[8px] tablet:gap-[8px] desktop:gap-[8px] text-[14px] tablet:text-[14px] desktop:text-[14px] text-muted-foreground [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-[16px] tablet:[&_svg:not([class*='size-'])]:size-[16px] desktop:[&_svg:not([class*='size-'])]:size-[16px]",
        className
      )}
      {...props}
    />
  )
}

function InputGroupInput({
  className,
  ...props
}: React.ComponentProps<"input">) {
  return (
    <Input
      data-slot="input-group-control"
      className={cn(
        "flex-1 rounded-none border-0 bg-transparent shadow-none ring-0 focus-visible:ring-0 disabled:bg-transparent aria-invalid:ring-0 dark:bg-transparent dark:disabled:bg-transparent",
        className
      )}
      {...props}
    />
  )
}

function InputGroupTextarea({
  className,
  ...props
}: React.ComponentProps<"textarea">) {
  return (
    <Textarea
      data-slot="input-group-control"
      className={cn(
        "flex-1 resize-none rounded-none border-0 bg-transparent py-[8px] tablet:py-[8px] desktop:py-[8px] shadow-none ring-0 focus-visible:ring-0 disabled:bg-transparent aria-invalid:ring-0 dark:bg-transparent dark:disabled:bg-transparent",
        className
      )}
      {...props}
    />
  )
}

export {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
  InputGroupInput,
  InputGroupTextarea,
}
