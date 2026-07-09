"use client";

import { useId, useMemo, useState } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { getCountries } from "libphonenumber-js";
import flags from "react-phone-number-input/flags";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { FieldComponentProps } from "../core/registry";
import type { FieldConfig } from "../core/types";
import { useFieldDisabled, useFieldRuntime } from "../components/FieldRuntime";
import { FieldWrapper, fieldAriaDescribedBy } from "../ui/FieldWrapper";

type CountryFieldConfig = Extract<FieldConfig, { type: "country" }>;

type CountryOption = { code: string; label: string };

function Flag({ code, label }: { code: string; label: string }) {
  const Component = flags[code as keyof typeof flags];
  if (!Component) return null;
  return (
    <span aria-hidden className="inline-flex w-[20px] tablet:w-[20px] desktop:w-[20px] shrink-0 overflow-hidden">
      <Component title={label} />
    </span>
  );
}

function buildOptions(config: CountryFieldConfig): { preferred: CountryOption[]; rest: CountryOption[] } {
  const codes = config.countries ?? (getCountries() as string[]);
  // Intl.DisplayNames is universally available in the supported runtimes;
  // the code itself is the fallback label if a name is missing.
  const names = new Intl.DisplayNames(undefined, { type: "region" });
  const labeled = codes
    .map((code) => ({ code, label: names.of(code) ?? code }))
    .sort((a, b) => a.label.localeCompare(b.label));
  const preferredOrder = config.preferredCountries ?? [];
  if (!preferredOrder.length) return { preferred: [], rest: labeled };
  const byCode = new Map(labeled.map((option) => [option.code, option]));
  const preferredSet = new Set(preferredOrder);
  return {
    // Preferred keep their configured order, the rest stay name-sorted.
    preferred: preferredOrder.map((code) => byCode.get(code)).filter(Boolean) as CountryOption[],
    rest: labeled.filter((option) => !preferredSet.has(option.code)),
  };
}

export function CountryField({ field }: FieldComponentProps) {
  const config = field as CountryFieldConfig;
  const { control } = useFormContext();
  const disabled = useFieldDisabled(config);
  const { messages } = useFieldRuntime();
  const id = useId();
  const [open, setOpen] = useState(false);

  const { preferred, rest } = useMemo(
    () => buildOptions(config),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [config.countries, config.preferredCountries],
  );

  const renderItem = (option: CountryOption, selected: string | undefined, onSelect: (code: string) => void) => (
    <CommandItem
      key={option.code}
      // Searchable by display name and ISO code.
      value={`${option.label} ${option.code}`}
      onSelect={() => onSelect(option.code)}
    >
      <Check
        className={cn(
          "me-[8px] tablet:me-[8px] desktop:me-[8px] size-[16px] tablet:size-[16px] desktop:size-[16px]",
          selected === option.code ? "opacity-100" : "opacity-0",
        )}
      />
      <Flag code={option.code} label={option.label} />
      <span className="ms-[8px] tablet:ms-[8px] desktop:ms-[8px] truncate">{option.label}</span>
    </CommandItem>
  );

  return (
    <Controller
      name={config.name}
      control={control}
      render={({ field: rhf, fieldState }) => {
        const selected = typeof rhf.value === "string" && rhf.value ? rhf.value : undefined;
        const selectedOption = selected
          ? [...preferred, ...rest].find((option) => option.code === selected)
          : undefined;

        const onSelect = (code: string) => {
          rhf.onChange(code);
          setOpen(false);
        };

        return (
          <FieldWrapper
            id={id}
            label={config.label}
            description={config.description}
            required={config.required}
            disabled={disabled}
            error={fieldState.error}
          >
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  ref={rhf.ref}
                  id={id}
                  type="button"
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  aria-invalid={!!fieldState.error}
                  aria-describedby={fieldAriaDescribedBy(id, {
                    description: config.description,
                    error: fieldState.error,
                  })}
                  disabled={disabled}
                  onBlur={rhf.onBlur}
                  className="w-full justify-between font-normal"
                >
                  <span className="flex min-w-0 items-center">
                    {selectedOption ? (
                      <>
                        <Flag code={selectedOption.code} label={selectedOption.label} />
                        <span className="ms-[8px] tablet:ms-[8px] desktop:ms-[8px] truncate">
                          {selectedOption.label}
                        </span>
                      </>
                    ) : (
                      <span className="truncate">{config.placeholder ?? ""}</span>
                    )}
                  </span>
                  <ChevronsUpDown className="ms-[8px] tablet:ms-[8px] desktop:ms-[8px] size-[16px] tablet:size-[16px] desktop:size-[16px] shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
                <Command>
                  <CommandInput placeholder={messages.country} />
                  <CommandList>
                    <CommandEmpty>{messages.noOptions}</CommandEmpty>
                    {preferred.length > 0 && (
                      <>
                        <CommandGroup>
                          {preferred.map((option) => renderItem(option, selected, onSelect))}
                        </CommandGroup>
                        <CommandSeparator />
                      </>
                    )}
                    <CommandGroup>{rest.map((option) => renderItem(option, selected, onSelect))}</CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </FieldWrapper>
        );
      }}
    />
  );
}
