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
import { SKIP_SYNC, useSourceSync } from "../hooks/useSourceSync";
import { applyCountryToPhoneValue } from "./phoneCountrySync";

type PhoneFieldConfig = Extract<FieldConfig, { type: "phone" }>;

// Borderless input: the PhoneInput container carries the input chrome so
// flag selector and number read as one field.
function BareInput({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      {...props}
      className={cn(
        "h-full w-full min-w-0 bg-transparent pe-[3.204vw] tablet:pe-[1.5vw] desktop:pe-[0.624vw] text-[3.738vw] tablet:text-[1.75vw] desktop:text-[0.728vw] outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed",
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
    <span aria-hidden className="inline-flex w-[5.34vw] tablet:w-[2.5vw] desktop:w-[1.04vw] overflow-hidden rounded-[0.534vw] tablet:rounded-[0.25vw] desktop:rounded-[0.104vw]">
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
  emptyMessage?: string;
};

function CountrySelect({ value, onChange, options, disabled, className, emptyMessage, ...rest }: CountrySelectProps) {
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
          className={cn("h-full shrink-0 gap-[1.068vw] tablet:gap-[0.5vw] desktop:gap-[0.208vw] rounded-e-none ps-[3.204vw] tablet:ps-[1.5vw] desktop:ps-[0.624vw] pe-[2.136vw] tablet:pe-[1vw] desktop:pe-[0.416vw] font-normal", className)}
        >
          <CountryFlag country={value} />
          <ChevronDown className="size-[3.738vw] tablet:size-[1.75vw] desktop:size-[0.728vw] shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[76.896vw] tablet:w-[36vw] desktop:w-[14.976vw] p-0" align="start">
        <Command
          filter={(itemValue, search) => (itemValue.toLowerCase().includes(search.toLowerCase()) ? 1 : 0)}
        >
          <CommandInput placeholder={rest["aria-label"]} />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
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
                      className={cn("me-[2.136vw] tablet:me-[1vw] desktop:me-[0.416vw] size-[4.272vw] tablet:size-[2vw] desktop:size-[0.832vw]", option.value === value ? "opacity-100" : "opacity-0")}
                    />
                    <span className="me-[2.136vw] tablet:me-[1vw] desktop:me-[0.416vw]">
                      <CountryFlag country={option.value} />
                    </span>
                    <span className="truncate">{option.label}</span>
                    <span className="ms-auto ps-[2.136vw] tablet:ps-[1vw] desktop:ps-[0.416vw] text-muted-foreground">{code}</span>
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

// Opt-in countryFrom sync: watch the source select and rewrite this field's
// calling code on change. The source always wins on change; the user can
// still override via the country select until the next source change.
// Baseline/seed/flag semantics live in useSourceSync (shared with copyFrom).
function useCountryFromSync(config: PhoneFieldConfig) {
  useSourceSync(config.name, config.countryFrom, {
    seed: (sourceValue, currentValue) => {
      // Only an empty phone gets seeded — a draft value must not be clobbered.
      const iso = typeof sourceValue === "string" && sourceValue ? sourceValue : undefined;
      if (!iso || currentValue) return SKIP_SYNC;
      const next = applyCountryToPhoneValue("", iso);
      return next === null ? SKIP_SYNC : next;
    },
    change: (sourceValue, currentValue) => {
      const iso = typeof sourceValue === "string" && sourceValue ? sourceValue : undefined;
      if (!iso) return SKIP_SYNC; // source cleared → keep current country
      const current = typeof currentValue === "string" ? currentValue : "";
      const next = applyCountryToPhoneValue(current, iso);
      if (next === null) {
        if (process.env.NODE_ENV !== "production") {
          console.warn(
            `form-builder: phone "${config.name}" countryFrom received non-ISO value "${String(sourceValue)}"`,
          );
        }
        return SKIP_SYNC;
      }
      return next;
    },
  });
}

export function PhoneField({ field }: FieldComponentProps) {
  const config = field as PhoneFieldConfig;
  const { control } = useFormContext();
  const disabled = useFieldDisabled(config);
  const { messages, locale } = useFieldRuntime();
  const id = useId();
  useCountryFromSync(config);

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
            // RHF's ref must ride the lib's forwarded ref, which it merges
            // with its internal input ref. A numberInputProps.ref would
            // clobber that internal ref and break focus-on-country-select —
            // the resulting crash aborts the country change entirely.
            ref={rhf.ref}
            value={(rhf.value as string) || undefined}
            onChange={(value) => rhf.onChange(value ?? "")}
            onBlur={rhf.onBlur}
            disabled={disabled}
            placeholder={config.placeholder}
            defaultCountry={config.defaultCountry as Country | undefined}
            countryOptionsOrder={config.preferredCountries as ComponentProps<typeof PhoneInput>["countryOptionsOrder"]}
            international
            countryCallingCodeEditable={false}
            labels={locale?.countryLabels}
            inputComponent={BareInput}
            countrySelectComponent={CountrySelect}
            countrySelectProps={{ "aria-label": messages.country, emptyMessage: messages.noOptions }}
            className={cn(
              "flex h-[9.612vw] tablet:h-[4.5vw] desktop:h-[1.872vw] w-full items-center gap-[1.068vw] tablet:gap-[0.5vw] desktop:gap-[0.208vw] rounded-[2.136vw] tablet:rounded-[1vw] desktop:rounded-[0.416vw] border border-input bg-transparent transition-colors",
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
