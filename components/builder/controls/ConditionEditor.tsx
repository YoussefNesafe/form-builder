"use client";

import { Plus, X } from "lucide-react";
import { fromConditionGroups, toConditionGroups, type Condition, type ConditionSpec } from "@/form-builder";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { builder } from "@/locales/en/builder";
import { eligibleRefs } from "../model/context";
import type { ControlProps } from "./types";
import { coerceScalar, scalarToText } from "./coerce";

const C = builder.controls.condition;

type Op = "equals" | "notEquals" | "in" | "isValid" | "isInvalid";

function opOf(c: Condition): Op {
  if ("isValid" in c && c.isValid !== undefined) return c.isValid ? "isValid" : "isInvalid";
  if ("in" in c && c.in !== undefined) return "in";
  if ("notEquals" in c && c.notEquals !== undefined) return "notEquals";
  return "equals";
}

function isValidityOp(op: Op): op is "isValid" | "isInvalid" {
  return op === "isValid" || op === "isInvalid";
}

function valueText(c: Condition, op: Op): string {
  if (isValidityOp(op)) return "";
  if (op === "in") return Array.isArray(c.in) ? c.in.map(scalarToText).join(", ") : "";
  return scalarToText(op === "notEquals" ? c.notEquals : c.equals);
}

function build(field: string, op: Op, text: string): Condition {
  if (isValidityOp(op)) return { field, isValid: op === "isValid" };
  if (op === "in") {
    return { field, in: text.split(",").map((s) => coerceScalar(s.trim())).filter((v) => v !== "") };
  }
  return { field, [op]: coerceScalar(text) };
}

/**
 * Edit a `ConditionSpec` as OR-groups of AND-rows. Absent = no conditions.
 * Emits the minimal shape (single condition / one array / anyOf).
 */
export function ConditionEditor({ id, value, onChange, descriptor, ctx }: ControlProps<ConditionSpec>) {
  const names = eligibleRefs(ctx.siblings, "any", ctx.node._id);
  // isValid needs the target's zod schema: built-in siblings only, and the
  // engine rejects isValid conditions inside groups entirely.
  const builtinNames = eligibleRefs(ctx.siblings, "builtin", ctx.node._id);
  const validityOps = !!descriptor.validityOps && !ctx.isNested && builtinNames.length > 0;

  const groups = toConditionGroups(value);
  const update = (next: Condition[][]) => onChange(fromConditionGroups(next));
  const seed = () => build(names[0] ?? "", "equals", "");

  if (groups.length === 0) {
    return (
      <Button
        id={id}
        variant="outline"
        size="sm"
        disabled={names.length === 0}
        onClick={() => update([[seed()]])}
      >
        {names.length === 0 ? C.noSiblingFields : C.addCondition}
      </Button>
    );
  }

  const setRow = (gi: number, ri: number, cond: Condition) =>
    update(groups.map((g, i) => (i === gi ? g.map((c, j) => (j === ri ? cond : c)) : g)));
  const removeRow = (gi: number, ri: number) => {
    const remaining = groups[gi].filter((_, j) => j !== ri);
    update(remaining.length === 0 ? groups.filter((_, i) => i !== gi) : groups.map((g, i) => (i === gi ? remaining : g)));
  };

  return (
    <div id={id} className="flex flex-col gap-[8px] tablet:gap-[8px] desktop:gap-[8px]">
      {groups.map((group, gi) => (
        <div key={gi} className="flex flex-col gap-[8px] tablet:gap-[8px] desktop:gap-[8px]">
          {gi > 0 && (
            <span className="text-[11px] tablet:text-[11px] desktop:text-[11px] font-medium uppercase text-muted-foreground">
              {C.or}
            </span>
          )}
          <div className="flex flex-col gap-[8px] tablet:gap-[8px] desktop:gap-[8px] rounded-[10px] tablet:rounded-[10px] desktop:rounded-[10px] border border-border p-[8px] tablet:p-[8px] desktop:p-[8px]">
            {group.map((cond, ri) => {
              const op = opOf(cond);
              const text = valueText(cond, op);
              const fieldNames = isValidityOp(op) ? builtinNames : names;
              return (
                <div key={ri} className="flex flex-col gap-[6px] tablet:gap-[6px] desktop:gap-[6px]">
                  {ri > 0 && (
                    <span className="text-[11px] tablet:text-[11px] desktop:text-[11px] font-medium uppercase text-muted-foreground">
                      {C.and}
                    </span>
                  )}
                  <div className="flex items-center gap-[6px] tablet:gap-[6px] desktop:gap-[6px]">
                    <Select value={cond.field} onValueChange={(f) => setRow(gi, ri, build(f, op, text))}>
                      <SelectTrigger aria-label={C.fieldAriaLabel} className="flex-1">
                        <SelectValue placeholder={C.fieldPlaceholder} />
                      </SelectTrigger>
                      <SelectContent>
                        {fieldNames.map((n) => (
                          <SelectItem key={n} value={n}>
                            {n}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      aria-label={C.removeAriaLabel}
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => removeRow(gi, ri)}
                    >
                      <X />
                    </Button>
                  </div>
                  <div className="flex items-center gap-[6px] tablet:gap-[6px] desktop:gap-[6px]">
                    <Select
                      value={op}
                      onValueChange={(next) => {
                        const nextOp = next as Op;
                        // Switching to a validity op with a non-built-in
                        // source selected: fall back to the first valid target.
                        const field =
                          isValidityOp(nextOp) && !builtinNames.includes(cond.field)
                            ? builtinNames[0] ?? cond.field
                            : cond.field;
                        setRow(gi, ri, build(field, nextOp, text));
                      }}
                    >
                      <SelectTrigger aria-label={C.operatorAriaLabel} className="w-[130px] tablet:w-[130px] desktop:w-[130px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="equals">{C.ops.equals}</SelectItem>
                        <SelectItem value="notEquals">{C.ops.notEquals}</SelectItem>
                        <SelectItem value="in">{C.ops.in}</SelectItem>
                        {validityOps && <SelectItem value="isValid">{C.ops.isValid}</SelectItem>}
                        {validityOps && <SelectItem value="isInvalid">{C.ops.isInvalid}</SelectItem>}
                      </SelectContent>
                    </Select>
                    {!isValidityOp(op) && (
                      <Input
                        aria-label={C.valueAriaLabel}
                        value={text}
                        placeholder={op === "in" ? C.inPlaceholder : C.valuePlaceholder}
                        onChange={(e) => setRow(gi, ri, build(cond.field, op, e.target.value))}
                      />
                    )}
                  </div>
                </div>
              );
            })}
            <Button
              variant="ghost"
              size="sm"
              className="w-fit text-muted-foreground"
              aria-label={C.addAndAriaLabel}
              onClick={() => update(groups.map((g, i) => (i === gi ? [...g, seed()] : g)))}
            >
              <Plus /> {C.addAndText}
            </Button>
          </div>
        </div>
      ))}
      <Button
        variant="ghost"
        size="sm"
        className="w-fit text-muted-foreground"
        aria-label={C.addOrAriaLabel}
        onClick={() => update([...groups, [seed()]])}
      >
        <Plus /> {C.addOrText}
      </Button>
    </div>
  );
}
