"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import type { Option } from "@/form-builder";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { builder } from "@/locales/en/builder";
import { fmt } from "@/locales/fmt";
import { eligibleRefs } from "../model/context";
import type { ControlProps } from "./types";
import { OptionsEditor } from "./OptionsEditor";

const C = builder.controls.optionsFrom;

type OptionsFrom = { field: string; map: Record<string, Option[]> };
type BranchPair = [string, Option[]];

function toRecord(pairs: BranchPair[]): Record<string, Option[]> {
  const record: Record<string, Option[]> = {};
  for (const [key, options] of pairs) {
    if (!(key in record)) record[key] = options;
  }
  return record;
}

export function OptionsFromEditor({
  id,
  value,
  onChange,
  descriptor,
  ctx,
}: ControlProps<OptionsFrom>) {
  const sources = eligibleRefs(ctx.siblings, "optionsSource", ctx.node._id);
  const [pairs, setPairs] = useState<BranchPair[]>(() =>
    Object.entries(value?.map ?? {}),
  );
  const nodeRef = useRef(ctx.node._id);
  useEffect(() => {
    if (nodeRef.current !== ctx.node._id) {
      nodeRef.current = ctx.node._id;
      setPairs(Object.entries(value?.map ?? {}));
    }
  }, [ctx.node._id, value]);

  const seedPairs = (sourceName: string): BranchPair[] => {
    const sourceNode = ctx.siblings.find((n) => n.props.name === sourceName);
    const sourceOptions = Array.isArray(sourceNode?.props.options)
      ? (sourceNode.props.options as Option[])
      : [];
    return sourceOptions.map((option) => [String(option.value), []]);
  };

  const commit = (field: string, nextPairs: BranchPair[]) => {
    setPairs(nextPairs);
    onChange({ field, map: toRecord(nextPairs) });
  };

  if (!value) {
    return (
      <Button
        id={id}
        variant="outline"
        size="sm"
        disabled={sources.length === 0}
        onClick={() => commit(sources[0] ?? "", seedPairs(sources[0] ?? ""))}
      >
        {sources.length === 0 ? C.noEligibleSources : C.addMapping}
      </Button>
    );
  }

  const seenKeys = new Set<string>();
  const duplicate = pairs.map(([key]) => {
    const isDuplicate = seenKeys.has(key);
    seenKeys.add(key);
    return isDuplicate;
  });

  return (
    <div
      id={id}
      className="flex flex-col gap-[2.136vw] tablet:gap-[1vw] desktop:gap-[0.416vw]"
    >
      <div className="flex items-center gap-[1.602vw] tablet:gap-[0.75vw] desktop:gap-[0.312vw]">
        <Select
          value={value.field}
          onValueChange={(source) => commit(source, seedPairs(source))}
        >
          <SelectTrigger aria-label={C.sourceFieldAriaLabel} className="flex-1">
            <SelectValue placeholder={C.sourceFieldPlaceholder} />
          </SelectTrigger>
          <SelectContent>
            {sources.map((name) => (
              <SelectItem key={name} value={name}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label={C.removeMappingAriaLabel}
          className="text-muted-foreground hover:text-destructive"
          onClick={() => {
            setPairs([]);
            onChange(undefined);
          }}
        >
          <X />
        </Button>
      </div>
      {pairs.map(([key, options], index) => (
        <div
          key={index}
          className="flex flex-col gap-[1.602vw] tablet:gap-[0.75vw] desktop:gap-[0.312vw] rounded-[2.67vw] tablet:rounded-[1.25vw] desktop:rounded-[0.52vw] border border-border p-[2.136vw] tablet:p-[1vw] desktop:p-[0.416vw]"
        >
          <div className="flex items-center gap-[1.602vw] tablet:gap-[0.75vw] desktop:gap-[0.312vw]">
            <Input
              aria-label={fmt(C.branchValueAriaLabel, { n: index + 1 })}
              aria-invalid={duplicate[index] || undefined}
              aria-describedby={
                duplicate[index] ? `${id}-branch-${index}-duplicate` : undefined
              }
              placeholder={C.branchValuePlaceholder}
              value={key}
              className={cn(duplicate[index] && "border-destructive")}
              onChange={(e) =>
                commit(
                  value.field,
                  pairs.map((pair, i) =>
                    i === index ? [e.target.value, pair[1]] : pair,
                  ),
                )
              }
            />
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label={fmt(C.removeBranchAriaLabel, { n: index + 1 })}
              className="text-muted-foreground hover:text-destructive"
              onClick={() =>
                commit(
                  value.field,
                  pairs.filter((_, i) => i !== index),
                )
              }
            >
              <X />
            </Button>
          </div>
          {duplicate[index] && (
            <p
              id={`${id}-branch-${index}-duplicate`}
              className="text-[2.937vw] tablet:text-[1.375vw] desktop:text-[0.572vw] text-destructive"
            >
              {C.duplicateWarning}
            </p>
          )}
          <OptionsEditor
            id={`${id}-branch-${index}`}
            value={options.length ? options : undefined}
            onChange={(opts) =>
              commit(
                value.field,
                pairs.map((pair, i) =>
                  i === index ? [pair[0], opts ?? []] : pair,
                ),
              )
            }
            descriptor={descriptor}
            ctx={ctx}
          />
        </div>
      ))}
      <Button
        variant="ghost"
        size="sm"
        className="w-fit text-muted-foreground"
        aria-label={C.addBranchAriaLabel}
        onClick={() => commit(value.field, [...pairs, ["", []]])}
      >
        <Plus /> {C.addBranchText}
      </Button>
    </div>
  );
}
