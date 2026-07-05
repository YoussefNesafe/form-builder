"use client"

import { useMemo } from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

function FieldSet({ className, ...props }: React.ComponentProps<"fieldset">) {
  return (
    <fieldset
      data-slot="field-set"
      className={cn(
        "flex flex-col gap-[16px] tablet:gap-[16px] desktop:gap-[16px] has-[>[data-slot=checkbox-group]]:gap-[12px] tablet:has-[>[data-slot=checkbox-group]]:gap-[12px] desktop:has-[>[data-slot=checkbox-group]]:gap-[12px] has-[>[data-slot=radio-group]]:gap-[12px] tablet:has-[>[data-slot=radio-group]]:gap-[12px] desktop:has-[>[data-slot=radio-group]]:gap-[12px]",
        className
      )}
      {...props}
    />
  )
}

function FieldLegend({
  className,
  variant = "legend",
  ...props
}: React.ComponentProps<"legend"> & { variant?: "legend" | "label" }) {
  return (
    <legend
      data-slot="field-legend"
      data-variant={variant}
      className={cn(
        "mb-[6px] tablet:mb-[6px] desktop:mb-[6px] font-medium data-[variant=label]:text-[14px] tablet:data-[variant=label]:text-[14px] desktop:data-[variant=label]:text-[14px] data-[variant=legend]:text-[16px] tablet:data-[variant=legend]:text-[16px] desktop:data-[variant=legend]:text-[16px]",
        className
      )}
      {...props}
    />
  )
}

function FieldGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="field-group"
      className={cn(
        "group/field-group @container/field-group flex w-full flex-col gap-[20px] tablet:gap-[20px] desktop:gap-[20px] data-[slot=checkbox-group]:gap-[12px] tablet:data-[slot=checkbox-group]:gap-[12px] desktop:data-[slot=checkbox-group]:gap-[12px] *:data-[slot=field-group]:gap-[16px] tablet:*:data-[slot=field-group]:gap-[16px] desktop:*:data-[slot=field-group]:gap-[16px]",
        className
      )}
      {...props}
    />
  )
}

const fieldVariants = cva(
  "group/field flex w-full gap-[8px] tablet:gap-[8px] desktop:gap-[8px] data-[invalid=true]:text-destructive",
  {
    variants: {
      orientation: {
        vertical: "flex-col *:w-full [&>.sr-only]:w-auto",
        horizontal:
          "flex-row items-center has-[>[data-slot=field-content]]:items-start *:data-[slot=field-label]:flex-auto has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px",
        responsive:
          "flex-col *:w-full @md/field-group:flex-row @md/field-group:items-center @md/field-group:*:w-auto @md/field-group:has-[>[data-slot=field-content]]:items-start @md/field-group:*:data-[slot=field-label]:flex-auto [&>.sr-only]:w-auto @md/field-group:has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px",
      },
    },
    defaultVariants: {
      orientation: "vertical",
    },
  }
)

function Field({
  className,
  orientation = "vertical",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof fieldVariants>) {
  return (
    <div
      role="group"
      data-slot="field"
      data-orientation={orientation}
      className={cn(fieldVariants({ orientation }), className)}
      {...props}
    />
  )
}

function FieldContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="field-content"
      className={cn(
        "group/field-content flex flex-1 flex-col gap-[2px] tablet:gap-[2px] desktop:gap-[2px] leading-snug",
        className
      )}
      {...props}
    />
  )
}

function FieldLabel({
  className,
  ...props
}: React.ComponentProps<typeof Label>) {
  return (
    <Label
      data-slot="field-label"
      className={cn(
        "group/field-label peer/field-label flex w-fit gap-[8px] tablet:gap-[8px] desktop:gap-[8px] leading-snug group-data-[disabled=true]/field:opacity-50 has-data-checked:border-primary/30 has-data-checked:bg-primary/5 has-[>[data-slot=field]]:rounded-[10px] tablet:has-[>[data-slot=field]]:rounded-[10px] desktop:has-[>[data-slot=field]]:rounded-[10px] has-[>[data-slot=field]]:border *:data-[slot=field]:p-[10px] tablet:*:data-[slot=field]:p-[10px] desktop:*:data-[slot=field]:p-[10px] dark:has-data-checked:border-primary/20 dark:has-data-checked:bg-primary/10",
        "has-[>[data-slot=field]]:w-full has-[>[data-slot=field]]:flex-col",
        className
      )}
      {...props}
    />
  )
}

function FieldTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="field-label"
      className={cn(
        "flex w-fit items-center gap-[8px] tablet:gap-[8px] desktop:gap-[8px] text-[14px] tablet:text-[14px] desktop:text-[14px] font-medium group-data-[disabled=true]/field:opacity-50",
        className
      )}
      {...props}
    />
  )
}

function FieldDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="field-description"
      className={cn(
        "text-start text-[14px] tablet:text-[14px] desktop:text-[14px] leading-normal font-normal text-muted-foreground group-has-data-horizontal/field:text-balance [[data-variant=legend]+&]:-mt-[6px] tablet:[[data-variant=legend]+&]:-mt-[6px] desktop:[[data-variant=legend]+&]:-mt-[6px]",
        "last:mt-0 nth-last-2:-mt-[4px] tablet:nth-last-2:-mt-[4px] desktop:nth-last-2:-mt-[4px]",
        "[&>a]:underline [&>a]:underline-offset-4 [&>a:hover]:text-primary",
        className
      )}
      {...props}
    />
  )
}

function FieldSeparator({
  children,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  children?: React.ReactNode
}) {
  return (
    <div
      data-slot="field-separator"
      data-content={!!children}
      className={cn(
        "relative -my-[8px] tablet:-my-[8px] desktop:-my-[8px] h-[20px] tablet:h-[20px] desktop:h-[20px] text-[14px] tablet:text-[14px] desktop:text-[14px] group-data-[variant=outline]/field-group:-mb-[8px] tablet:group-data-[variant=outline]/field-group:-mb-[8px] desktop:group-data-[variant=outline]/field-group:-mb-[8px]",
        className
      )}
      {...props}
    >
      <Separator className="absolute inset-0 top-1/2" />
      {children && (
        <span
          className="relative mx-auto block w-fit bg-background px-[8px] tablet:px-[8px] desktop:px-[8px] text-muted-foreground"
          data-slot="field-separator-content"
        >
          {children}
        </span>
      )}
    </div>
  )
}

function FieldError({
  className,
  children,
  errors,
  ...props
}: React.ComponentProps<"div"> & {
  errors?: Array<{ message?: string } | undefined>
}) {
  const content = useMemo(() => {
    if (children) {
      return children
    }

    if (!errors?.length) {
      return null
    }

    const uniqueErrors = [
      ...new Map(errors.map((error) => [error?.message, error])).values(),
    ]

    if (uniqueErrors?.length == 1) {
      return uniqueErrors[0]?.message
    }

    return (
      <ul className="ms-[16px] tablet:ms-[16px] desktop:ms-[16px] flex list-disc flex-col gap-[4px] tablet:gap-[4px] desktop:gap-[4px]">
        {uniqueErrors.map(
          (error, index) =>
            error?.message && <li key={index}>{error.message}</li>
        )}
      </ul>
    )
  }, [children, errors])

  if (!content) {
    return null
  }

  return (
    <div
      role="alert"
      data-slot="field-error"
      className={cn("text-[14px] tablet:text-[14px] desktop:text-[14px] font-normal text-destructive", className)}
      {...props}
    >
      {content}
    </div>
  )
}

export {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldContent,
  FieldTitle,
}
