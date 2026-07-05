"use client";

import { useId, useState, type ComponentProps } from "react";
import { Controller, useFormContext } from "react-hook-form";
import PhoneInput, { getCountryCallingCode, type Country } from "react-phone-number-input";
import flags from "react-phone-number-input/flags";
import { Check, ChevronDown } from "lucide-react";
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
import { cn } from "@/lib/utils";
import type { FieldComponentProps } from "../core/registry";
import type { FieldConfig } from "../core/types";
import { useFieldDisabled, useFieldRuntime } from "../components/FieldRuntime";
import { FieldWrapper, fieldAriaDescribedBy } from "../ui/FieldWrapper";

type PhoneFieldConfig = Extract<FieldConfig, { type: "phone" }>;

// Borderless input: the PhoneInput container carries the input chrome so
// flag selector and number read as one field.
function BareInput({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      {...props}
      className={cn(
        "h-full w-full min-w-0 bg-transparent pe-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed",
        className,
      )}
    />
  );
}

// SVG flags: emoji flags render as plain letters on Windows.
function CountryFlag({ country }: { country?: string }) {
  const Flag = country ? flags[country as Country] : undefined;
  if (!Flag) return <span aria-hidden>🌐</span>;
  return (
    <span aria-hidden className="inline-flex w-5 overflow-hidden rounded-xs">
      <Flag title="" />
    </span>
  );
}

function callingCode(country: string): string {
  try {
    return `+${getCountryCallingCode(country as Country)}`;
  } catch {
    return "";
  }
}

type CountrySelectProps = {
  value?: string;
  onChange: (value?: string) => void;
  options: { value?: string; label: string }[];
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
};

function CountrySelect({ value, onChange, options, disabled, className, ...rest }: CountrySelectProps) {
  const [open, setOpen] = useState(false);
  const countries = options.filter((option) => option.value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          role="combobox"
          aria-expanded={open}
          aria-label={rest["aria-label"]}
          disabled={disabled}
          className={cn("h-full shrink-0 gap-1 rounded-e-none ps-3 pe-2 font-normal", className)}
        >
          <CountryFlag country={value} />
          <ChevronDown className="size-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        <Command
          filter={(itemValue, search) => (itemValue.toLowerCase().includes(search.toLowerCase()) ? 1 : 0)}
        >
          <CommandInput placeholder={rest["aria-label"]} />
          <CommandList>
            <CommandEmpty>—</CommandEmpty>
            <CommandGroup>
              {countries.map((option) => {
                const code = callingCode(option.value as string);
                return (
                  <CommandItem
                    key={option.value}
                    value={`${option.label} ${code} ${option.value}`}
                    onSelect={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn("me-2 size-4", option.value === value ? "opacity-100" : "opacity-0")}
                    />
                    <span className="me-2">
                      <CountryFlag country={option.value} />
                    </span>
                    <span className="truncate">{option.label}</span>
                    <span className="ms-auto ps-2 text-muted-foreground">{code}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function PhoneField({ field }: FieldComponentProps) {
  const config = field as PhoneFieldConfig;
  const { control } = useFormContext();
  const disabled = useFieldDisabled(config);
  const { messages } = useFieldRuntime();
  const id = useId();

  return (
    <Controller
      name={config.name}
      control={control}
      render={({ field: rhf, fieldState }) => {
        // Validation runs on blur (mode onTouched); green confirms a number
        // that passed the libphonenumber check.
        const isValid = fieldState.isTouched && !fieldState.error && !!rhf.value;
        return (
        <FieldWrapper
          id={id}
          label={config.label}
          description={config.description}
          required={config.required}
          disabled={disabled}
          error={fieldState.error}
        >
          <PhoneInput
            id={id}
            value={(rhf.value as string) || undefined}
            onChange={(value) => rhf.onChange(value ?? "")}
            onBlur={rhf.onBlur}
            disabled={disabled}
            placeholder={config.placeholder}
            defaultCountry={config.defaultCountry as Country | undefined}
            countryOptionsOrder={config.preferredCountries as ComponentProps<typeof PhoneInput>["countryOptionsOrder"]}
            international
            countryCallingCodeEditable={false}
            inputComponent={BareInput}
            countrySelectComponent={CountrySelect}
            countrySelectProps={{ "aria-label": messages.country }}
            className={cn(
              "flex h-9 w-full items-center gap-1 rounded-md border border-input bg-transparent transition-colors",
              "focus-within:border-ring dark:bg-input/30",
              disabled && "opacity-50",
              fieldState.error && "border-destructive focus-within:border-destructive",
              isValid && "border-green-600 focus-within:border-green-600 dark:border-green-500",
            )}
            numberInputProps={{
              "aria-invalid": !!fieldState.error,
              "aria-describedby": fieldAriaDescribedBy(id, {
                description: config.description,
                error: fieldState.error,
              }),
            }}
          />
        </FieldWrapper>
        );
      }}
    />
  );
}
