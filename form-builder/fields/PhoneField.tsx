"use client";

import { useEffect, useId, useRef, useState, type ComponentProps } from "react";
import { Controller, useFormContext, useWatch } from "react-hook-form";
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
import { applyCountryToPhoneValue } from "./phoneCountrySync";

type PhoneFieldConfig = Extract<FieldConfig, { type: "phone" }>;

// Borderless input: the PhoneInput container carries the input chrome so
// flag selector and number read as one field.
function BareInput({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      {...props}
      className={cn(
        "h-full w-full min-w-0 bg-transparent pe-[12px] tablet:pe-[12px] desktop:pe-[12px] text-[14px] tablet:text-[14px] desktop:text-[14px] outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed",
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
    <span aria-hidden className="inline-flex w-[20px] tablet:w-[20px] desktop:w-[20px] overflow-hidden rounded-[2px] tablet:rounded-[2px] desktop:rounded-[2px]">
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
          className={cn("h-full shrink-0 gap-[4px] tablet:gap-[4px] desktop:gap-[4px] rounded-e-none ps-[12px] tablet:ps-[12px] desktop:ps-[12px] pe-[8px] tablet:pe-[8px] desktop:pe-[8px] font-normal", className)}
        >
          <CountryFlag country={value} />
          <ChevronDown className="size-[14px] tablet:size-[14px] desktop:size-[14px] shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[288px] tablet:w-[288px] desktop:w-[288px] p-0" align="start">
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
                      className={cn("me-[8px] tablet:me-[8px] desktop:me-[8px] size-[16px] tablet:size-[16px] desktop:size-[16px]", option.value === value ? "opacity-100" : "opacity-0")}
                    />
                    <span className="me-[8px] tablet:me-[8px] desktop:me-[8px]">
                      <CountryFlag country={option.value} />
                    </span>
                    <span className="truncate">{option.label}</span>
                    <span className="ms-auto ps-[8px] tablet:ps-[8px] desktop:ps-[8px] text-muted-foreground">{code}</span>
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
// calling code on change. Same useWatch pattern as otp dependsOn. The source
// always wins on change; the user can still override via the country select
// until the next source change (per design).
function useCountryFromSync(config: PhoneFieldConfig) {
  const { control, getValues, setValue, getFieldState } = useFormContext();
  const source = config.countryFrom;
  // useWatch needs a name even when the feature is off; watching this field
  // itself with disabled: true is a no-op placeholder.
  const watched = useWatch({ control, name: source ?? config.name, disabled: !source });
  const prev = useRef<unknown>(undefined);
  const mounted = useRef(false);

  useEffect(() => {
    if (!source) return;
    const iso = typeof watched === "string" && watched ? watched : undefined;
    if (!mounted.current) {
      // First render after (re)mount is baseline, not a change: a draft value
      // must not be clobbered. Only an empty phone gets seeded.
      mounted.current = true;
      prev.current = watched;
      if (iso && !getValues(config.name)) {
        const next = applyCountryToPhoneValue("", iso);
        // Seed is initialization, not an edit — no flags on purpose (the
        // field stays pristine: not dirty, not touched, not validated).
        if (next) setValue(config.name, next);
      }
      return;
    }
    if (watched === prev.current) return;
    prev.current = watched;
    if (!iso) return; // source cleared → keep current country
    const raw = getValues(config.name);
    const current = typeof raw === "string" ? raw : "";
    const next = applyCountryToPhoneValue(current, iso);
    if (next === null) {
      if (process.env.NODE_ENV !== "production") {
        console.warn(
          `form-builder: phone "${config.name}" countryFrom received non-ISO value "${String(watched)}"`,
        );
      }
      return;
    }
    // Mode is onTouched: a touched field already shows validation state, so
    // the rewrite must re-validate or a stale green/error border survives
    // until the next blur. Untouched fields skip it — no premature errors.
    const { isTouched } = getFieldState(config.name);
    if (next !== current) setValue(config.name, next, { shouldDirty: true, shouldValidate: isTouched });
  }, [watched, source, config.name, getValues, setValue, getFieldState]);
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
              "flex h-[36px] tablet:h-[36px] desktop:h-[36px] w-full items-center gap-[4px] tablet:gap-[4px] desktop:gap-[4px] rounded-[8px] tablet:rounded-[8px] desktop:rounded-[8px] border border-input bg-transparent transition-colors",
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
