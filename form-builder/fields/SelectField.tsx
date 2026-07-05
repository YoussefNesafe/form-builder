"use client";

import { useId, useState } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { FieldComponentProps } from "../core/registry";
import type { FieldConfig, Option } from "../core/types";
import { useFieldDisabled } from "../components/FieldRuntime";
import { FieldWrapper, fieldAriaDescribedBy } from "../ui/FieldWrapper";

type SelectFieldConfig = Extract<FieldConfig, { type: "select" }>;

function optionByString(options: Option[], selected: string): Option["value"] | undefined {
  return options.find((option) => String(option.value) === selected)?.value;
}

export function SelectField({ field }: FieldComponentProps) {
  const config = field as SelectFieldConfig;
  const { control } = useFormContext();
  const disabled = useFieldDisabled(config);
  const id = useId();
  const [open, setOpen] = useState(false);

  const useCombobox = !!config.searchable || !!config.multiple;

  return (
    <Controller
      name={config.name}
      control={control}
      render={({ field: rhf, fieldState }) => {
        const describedBy = fieldAriaDescribedBy(id, {
          description: config.description,
          error: fieldState.error,
        });

        const control_ = useCombobox ? (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                id={id}
                type="button"
                variant="outline"
                role="combobox"
                aria-expanded={open}
                aria-invalid={!!fieldState.error}
                aria-describedby={describedBy}
                disabled={disabled}
                onBlur={rhf.onBlur}
                className="w-full justify-between font-normal"
              >
                <span className="truncate">
                  {config.multiple
                    ? Array.isArray(rhf.value) && rhf.value.length
                      ? config.options
                          .filter((option) => (rhf.value as Option["value"][]).includes(option.value))
                          .map((option) => option.label)
                          .join(", ")
                      : (config.placeholder ?? "")
                    : (config.options.find((option) => option.value === rhf.value)?.label ??
                      config.placeholder ??
                      "")}
                </span>
                <ChevronsUpDown className="ms-2 size-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
              <Command>
                {config.searchable && <CommandInput placeholder={config.placeholder} />}
                <CommandList>
                  <CommandEmpty>—</CommandEmpty>
                  <CommandGroup>
                    {config.options.map((option) => {
                      const selected = config.multiple
                        ? Array.isArray(rhf.value) && (rhf.value as Option["value"][]).includes(option.value)
                        : rhf.value === option.value;
                      return (
                        <CommandItem
                          key={option.value}
                          value={String(option.label)}
                          disabled={option.disabled}
                          onSelect={() => {
                            if (config.multiple) {
                              const current = Array.isArray(rhf.value) ? (rhf.value as Option["value"][]) : [];
                              rhf.onChange(
                                selected
                                  ? current.filter((entry) => entry !== option.value)
                                  : [...current, option.value],
                              );
                            } else {
                              rhf.onChange(option.value);
                              setOpen(false);
                            }
                          }}
                        >
                          <Check className={cn("me-2 size-4", selected ? "opacity-100" : "opacity-0")} />
                          {option.label}
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        ) : (
          <Select
            value={rhf.value === undefined || rhf.value === null ? "" : String(rhf.value)}
            onValueChange={(selected) => rhf.onChange(optionByString(config.options, selected))}
            disabled={disabled}
          >
            <SelectTrigger
              id={id}
              aria-invalid={!!fieldState.error}
              aria-describedby={describedBy}
              onBlur={rhf.onBlur}
              className="w-full"
            >
              <SelectValue placeholder={config.placeholder} />
            </SelectTrigger>
            <SelectContent>
              {config.options.map((option) => (
                <SelectItem key={option.value} value={String(option.value)} disabled={option.disabled}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

        return (
          <FieldWrapper
            id={id}
            label={config.label}
            description={config.description}
            required={config.required}
            disabled={disabled}
            error={fieldState.error}
          >
            {control_}
          </FieldWrapper>
        );
      }}
    />
  );
}
