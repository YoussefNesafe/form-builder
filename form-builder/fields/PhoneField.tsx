"use client";

import { useId, type ComponentProps } from "react";
import { Controller, useFormContext } from "react-hook-form";
import PhoneInput, { type Country } from "react-phone-number-input";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { FieldComponentProps } from "../core/registry";
import type { FieldConfig } from "../core/types";
import { useFieldDisabled, useFieldRuntime } from "../components/FieldRuntime";
import { FieldWrapper, fieldAriaDescribedBy } from "../ui/FieldWrapper";

type PhoneFieldConfig = Extract<FieldConfig, { type: "phone" }>;

function flagEmoji(country: string): string {
  return String.fromCodePoint(...[...country.toUpperCase()].map((char) => 0x1f1a5 + char.charCodeAt(0)));
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
  return (
    <div className={cn("relative flex items-center", className)}>
      <span aria-hidden className="pointer-events-none absolute start-2 text-base">
        {value ? flagEmoji(value) : "🌐"}
      </span>
      <select
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value || undefined)}
        disabled={disabled}
        aria-label={rest["aria-label"]}
        className="h-9 w-16 appearance-none rounded-md border border-input bg-transparent ps-8 pe-1 text-sm text-transparent shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
      >
        <option value="">—</option>
        {options
          .filter((option) => option.value)
          .map((option) => (
            <option key={option.value} value={option.value} className="text-foreground">
              {option.label}
            </option>
          ))}
      </select>
    </div>
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
      render={({ field: rhf, fieldState }) => (
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
            inputComponent={Input}
            countrySelectComponent={CountrySelect}
            countrySelectProps={{ "aria-label": messages.country }}
            className="flex gap-2"
            numberInputProps={{
              "aria-invalid": !!fieldState.error,
              "aria-describedby": fieldAriaDescribedBy(id, {
                description: config.description,
                error: fieldState.error,
              }),
            }}
          />
        </FieldWrapper>
      )}
    />
  );
}
