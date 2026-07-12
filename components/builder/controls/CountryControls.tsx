"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
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
import { builder } from "@/locales/en/builder";
import { fmt } from "@/locales/fmt";
import { COUNTRIES, countryLabel } from "./countries";
import { CLEAR_VALUE } from "./sentinels";
import type { ControlProps } from "./types";

const C = builder.controls.country;

/** Shared Popover>Command scaffold behind both country pickers below. */
function CountryPickerShell({
  id,
  triggerLabel,
  open,
  onOpenChange,
  children,
}: {
  id?: string;
  triggerLabel: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button id={id} variant="outline" size="sm" role="combobox" className="w-full justify-between">
          <span className="truncate">{triggerLabel}</span>
          <ChevronsUpDown className="opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="p-0 tablet:p-0 desktop:p-0">
        <Command>
          <CommandInput placeholder={C.searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{C.noResults}</CommandEmpty>
            <CommandGroup>{children}</CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

/** Single ISO alpha-2 country picker (searchable). */
export function CountryCodeControl({ id, value, onChange }: ControlProps<string>) {
  const [open, setOpen] = useState(false);
  return (
    <CountryPickerShell
      id={id}
      open={open}
      onOpenChange={setOpen}
      triggerLabel={value ? `${countryLabel(value)} (${value})` : C.selectCountry}
    >
      {value && (
        <CommandItem value={CLEAR_VALUE} onSelect={() => { onChange(undefined); setOpen(false); }}>
          <X className="opacity-60" />
          {C.clear}
        </CommandItem>
      )}
      {COUNTRIES.map((c) => (
        <CommandItem
          key={c.code}
          value={`${c.label} ${c.code}`}
          onSelect={() => { onChange(c.code); setOpen(false); }}
        >
          <Check className={value === c.code ? "opacity-100" : "opacity-0"} />
          {c.label} <span className="text-muted-foreground">({c.code})</span>
        </CommandItem>
      ))}
    </CountryPickerShell>
  );
}

/** Multi ISO alpha-2 country picker; stores a string[]. */
export function CountryListControl({ id, value, onChange }: ControlProps<string[]>) {
  const [open, setOpen] = useState(false);
  const selected = value ?? [];
  const toggle = (code: string) => {
    const next = selected.includes(code) ? selected.filter((c) => c !== code) : [...selected, code];
    onChange(next.length ? next : undefined);
  };

  return (
    <div className="flex flex-col gap-[6px] tablet:gap-[6px] desktop:gap-[6px]">
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-[4px] tablet:gap-[4px] desktop:gap-[4px]">
          {selected.map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => toggle(code)}
              className="flex items-center gap-[4px] tablet:gap-[4px] desktop:gap-[4px] rounded-[6px] tablet:rounded-[6px] desktop:rounded-[6px] border border-border px-[6px] tablet:px-[6px] desktop:px-[6px] py-[2px] tablet:py-[2px] desktop:py-[2px] text-[12px] tablet:text-[12px] desktop:text-[12px]"
            >
              {code}
              <X className="opacity-60" />
            </button>
          ))}
        </div>
      )}
      <CountryPickerShell
        id={id}
        open={open}
        onOpenChange={setOpen}
        triggerLabel={selected.length ? fmt(C.selectedCount, { n: selected.length }) : C.addCountries}
      >
        {COUNTRIES.map((c) => (
          <CommandItem key={c.code} value={`${c.label} ${c.code}`} onSelect={() => toggle(c.code)}>
            <Check className={selected.includes(c.code) ? "opacity-100" : "opacity-0"} />
            {c.label} <span className="text-muted-foreground">({c.code})</span>
          </CommandItem>
        ))}
      </CountryPickerShell>
    </div>
  );
}
