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
import { COUNTRIES, countryLabel } from "./countries";
import type { ControlProps } from "./types";

/** Single ISO alpha-2 country picker (searchable). */
export function CountryCodeControl({ id, value, onChange }: ControlProps<string>) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button id={id} variant="outline" size="sm" role="combobox" className="w-full justify-between">
          <span className="truncate">{value ? `${countryLabel(value)} (${value})` : "Select country"}</span>
          <ChevronsUpDown className="opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="p-0 tablet:p-0 desktop:p-0">
        <Command>
          <CommandInput placeholder="Search country…" />
          <CommandList>
            <CommandEmpty>No country found.</CommandEmpty>
            <CommandGroup>
              {value && (
                <CommandItem value="__clear__" onSelect={() => { onChange(undefined); setOpen(false); }}>
                  <X className="opacity-60" />
                  Clear
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
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
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
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button id={id} variant="outline" size="sm" role="combobox" className="w-full justify-between">
            <span className="truncate">{selected.length ? `${selected.length} selected` : "Add countries"}</span>
            <ChevronsUpDown className="opacity-60" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="p-0 tablet:p-0 desktop:p-0">
          <Command>
            <CommandInput placeholder="Search country…" />
            <CommandList>
              <CommandEmpty>No country found.</CommandEmpty>
              <CommandGroup>
                {COUNTRIES.map((c) => (
                  <CommandItem key={c.code} value={`${c.label} ${c.code}`} onSelect={() => toggle(c.code)}>
                    <Check className={selected.includes(c.code) ? "opacity-100" : "opacity-0"} />
                    {c.label} <span className="text-muted-foreground">({c.code})</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
