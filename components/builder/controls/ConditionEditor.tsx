"use client";

import { X } from "lucide-react";
import type { Condition } from "@/form-builder";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { eligibleRefs } from "../model/context";
import type { ControlProps } from "./types";
import { coerceScalar, scalarToText } from "./coerce";

type Op = "equals" | "notEquals" | "in";

function opOf(c: Condition): Op {
  if ("in" in c && c.in !== undefined) return "in";
  if ("notEquals" in c && c.notEquals !== undefined) return "notEquals";
  return "equals";
}

function valueText(c: Condition, op: Op): string {
  if (op === "in") return Array.isArray(c.in) ? c.in.map(scalarToText).join(", ") : "";
  return scalarToText(op === "notEquals" ? c.notEquals : c.equals);
}

function build(field: string, op: Op, text: string): Condition {
  if (op === "in") {
    return { field, in: text.split(",").map((s) => coerceScalar(s.trim())).filter((v) => v !== "") };
  }
  return { field, [op]: coerceScalar(text) };
}

/** Edit a `Condition` (field · operator · value). Absent = no condition. */
export function ConditionEditor({ id, value, onChange, ctx }: ControlProps<Condition>) {
  const names = eligibleRefs(ctx.siblings, "any", ctx.node._id);

  if (!value) {
    return (
      <Button
        id={id}
        variant="outline"
        size="sm"
        disabled={names.length === 0}
        onClick={() => onChange(build(names[0] ?? "", "equals", ""))}
      >
        {names.length === 0 ? "No sibling fields to reference" : "Add condition"}
      </Button>
    );
  }

  const op = opOf(value);
  const text = valueText(value, op);

  return (
    <div id={id} className="flex flex-col gap-[6px] tablet:gap-[6px] desktop:gap-[6px] rounded-[10px] tablet:rounded-[10px] desktop:rounded-[10px] border border-border p-[8px] tablet:p-[8px] desktop:p-[8px]">
      <div className="flex items-center gap-[6px] tablet:gap-[6px] desktop:gap-[6px]">
        <Select value={value.field} onValueChange={(f) => onChange(build(f, op, text))}>
          <SelectTrigger aria-label="Condition field" className="flex-1">
            <SelectValue placeholder="Field" />
          </SelectTrigger>
          <SelectContent>
            {names.map((n) => (
              <SelectItem key={n} value={n}>
                {n}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label="Remove condition"
          className="text-muted-foreground hover:text-destructive"
          onClick={() => onChange(undefined)}
        >
          <X />
        </Button>
      </div>
      <div className="flex items-center gap-[6px] tablet:gap-[6px] desktop:gap-[6px]">
        <Select value={op} onValueChange={(o) => onChange(build(value.field, o as Op, text))}>
          <SelectTrigger aria-label="Condition operator" className="w-[130px] tablet:w-[130px] desktop:w-[130px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="equals">equals</SelectItem>
            <SelectItem value="notEquals">not equals</SelectItem>
            <SelectItem value="in">in (list)</SelectItem>
          </SelectContent>
        </Select>
        <Input
          aria-label="Condition value"
          value={text}
          placeholder={op === "in" ? "a, b, c" : "value"}
          onChange={(e) => onChange(build(value.field, op, e.target.value))}
        />
      </div>
    </div>
  );
}
