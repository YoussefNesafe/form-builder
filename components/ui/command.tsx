"use client"

import * as React from "react"
import { Command as CommandPrimitive } from "cmdk"

import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  InputGroup,
  InputGroupAddon,
} from "@/components/ui/input-group"
import { SearchIcon, CheckIcon } from "lucide-react"

function Command({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive>) {
  return (
    <CommandPrimitive
      data-slot="command"
      className={cn(
        "flex size-full flex-col overflow-hidden rounded-[14px]! tablet:rounded-[14px]! desktop:rounded-[14px]! bg-popover p-[4px] tablet:p-[4px] desktop:p-[4px] text-popover-foreground",
        className
      )}
      {...props}
    />
  )
}

function CommandDialog({
  title = "Command Palette",
  description = "Search for a command to run...",
  children,
  className,
  showCloseButton = false,
  ...props
}: React.ComponentProps<typeof Dialog> & {
  title?: string
  description?: string
  className?: string
  showCloseButton?: boolean
}) {
  return (
    <Dialog {...props}>
      <DialogHeader className="sr-only">
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <DialogContent
        className={cn(
          "top-1/3 translate-y-0 overflow-hidden rounded-[14px]! tablet:rounded-[14px]! desktop:rounded-[14px]! p-0",
          className
        )}
        showCloseButton={showCloseButton}
      >
        {children}
      </DialogContent>
    </Dialog>
  )
}

function CommandInput({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Input>) {
  return (
    <div data-slot="command-input-wrapper" className="p-[4px] tablet:p-[4px] desktop:p-[4px] pb-0">
      <InputGroup className="h-[32px]! tablet:h-[32px]! desktop:h-[32px]! rounded-[10px]! tablet:rounded-[10px]! desktop:rounded-[10px]! border-input/30 bg-input/30 shadow-none! *:data-[slot=input-group-addon]:ps-[8px]! tablet:*:data-[slot=input-group-addon]:ps-[8px]! desktop:*:data-[slot=input-group-addon]:ps-[8px]!">
        <CommandPrimitive.Input
          data-slot="command-input"
          className={cn(
            "w-full text-[14px] tablet:text-[14px] desktop:text-[14px] outline-hidden disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          {...props}
        />
        <InputGroupAddon>
          <SearchIcon className="size-[16px] tablet:size-[16px] desktop:size-[16px] shrink-0 opacity-50" />
        </InputGroupAddon>
      </InputGroup>
    </div>
  )
}

function CommandList({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.List>) {
  return (
    <CommandPrimitive.List
      data-slot="command-list"
      className={cn(
        "no-scrollbar max-h-[288px] tablet:max-h-[288px] desktop:max-h-[288px] scroll-py-[4px] tablet:scroll-py-[4px] desktop:scroll-py-[4px] overflow-x-hidden overflow-y-auto outline-none",
        className
      )}
      {...props}
    />
  )
}

function CommandEmpty({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Empty>) {
  return (
    <CommandPrimitive.Empty
      data-slot="command-empty"
      className={cn("py-[24px] tablet:py-[24px] desktop:py-[24px] text-center text-[14px] tablet:text-[14px] desktop:text-[14px]", className)}
      {...props}
    />
  )
}

function CommandGroup({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Group>) {
  return (
    <CommandPrimitive.Group
      data-slot="command-group"
      className={cn(
        "overflow-hidden p-[4px] tablet:p-[4px] desktop:p-[4px] text-foreground **:[[cmdk-group-heading]]:px-[8px] tablet:**:[[cmdk-group-heading]]:px-[8px] desktop:**:[[cmdk-group-heading]]:px-[8px] **:[[cmdk-group-heading]]:py-[6px] tablet:**:[[cmdk-group-heading]]:py-[6px] desktop:**:[[cmdk-group-heading]]:py-[6px] **:[[cmdk-group-heading]]:text-[12px] tablet:**:[[cmdk-group-heading]]:text-[12px] desktop:**:[[cmdk-group-heading]]:text-[12px] **:[[cmdk-group-heading]]:font-medium **:[[cmdk-group-heading]]:text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

function CommandSeparator({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Separator>) {
  return (
    <CommandPrimitive.Separator
      data-slot="command-separator"
      className={cn("-mx-[4px] tablet:-mx-[4px] desktop:-mx-[4px] h-px bg-border", className)}
      {...props}
    />
  )
}

function CommandItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Item>) {
  return (
    <CommandPrimitive.Item
      data-slot="command-item"
      className={cn(
        "group/command-item relative flex cursor-default items-center gap-[8px] tablet:gap-[8px] desktop:gap-[8px] rounded-[6px] tablet:rounded-[6px] desktop:rounded-[6px] px-[8px] tablet:px-[8px] desktop:px-[8px] py-[6px] tablet:py-[6px] desktop:py-[6px] text-[14px] tablet:text-[14px] desktop:text-[14px] outline-hidden select-none in-data-[slot=dialog-content]:rounded-[10px]! tablet:in-data-[slot=dialog-content]:rounded-[10px]! desktop:in-data-[slot=dialog-content]:rounded-[10px]! data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 data-selected:bg-muted data-selected:text-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-[16px] tablet:[&_svg:not([class*='size-'])]:size-[16px] desktop:[&_svg:not([class*='size-'])]:size-[16px] data-selected:*:[svg]:text-foreground",
        className
      )}
      {...props}
    >
      {children}
      <CheckIcon className="ms-auto opacity-0 group-has-data-[slot=command-shortcut]/command-item:hidden group-data-[checked=true]/command-item:opacity-100" />
    </CommandPrimitive.Item>
  )
}

function CommandShortcut({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="command-shortcut"
      className={cn(
        "ms-auto text-[12px] tablet:text-[12px] desktop:text-[12px] tracking-widest text-muted-foreground group-data-selected/command-item:text-foreground",
        className
      )}
      {...props}
    />
  )
}

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
}
