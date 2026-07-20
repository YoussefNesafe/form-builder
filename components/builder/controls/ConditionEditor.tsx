"use client";

import { Plus, X } from "lucide-react";
import {
  fromConditionGroups,
  toConditionGroups,
  type Condition,
  type ConditionSpec,
} from "@/form-builder";
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
  if ("isValid" in c && c.isValid !== undefined)
    return c.isValid ? "isValid" : "isInvalid";
  if ("in" in c && c.in !== undefined) return "in";
  if ("notEquals" in c && c.notEquals !== undefined) return "notEquals";
  return "equals";
}

function isValidityOp(op: Op): op is "isValid" | "isInvalid" {
  return op === "isValid" || op === "isInvalid";
}

function valueText(c: Condition, op: Op): string {
  if (isValidityOp(op)) return "";
  if (op === "in")
    return Array.isArray(c.in) ? c.in.map(scalarToText).join(", ") : "";
  return scalarToText(op === "notEquals" ? c.notEquals : c.equals);
}

function build(field: string, op: Op, text: string): Condition {
  if (isValidityOp(op)) return { field, isValid: op === "isValid" };
  if (op === "in") {
    return {
      field,
      in: text
        .split(",")
        .map((s) => coerceScalar(s.trim()))
        .filter((v) => v !== ""),
    };
  }
  return { field, [op]: coerceScalar(text) };
}

export function ConditionEditor({
  id,
  value,
  onChange,
  descriptor,
  ctx,
}: ControlProps<ConditionSpec>) {
  const names = eligibleRefs(ctx.siblings, "any", ctx.node._id);
  const builtinNames = eligibleRefs(ctx.siblings, "builtin", ctx.node._id);
  const validityOps =
    !!descriptor.validityOps && !ctx.isNested && builtinNames.length > 0;

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
    update(
      groups.map((g, i) =>
        i === gi ? g.map((c, j) => (j === ri ? cond : c)) : g,
      ),
    );
  const removeRow = (gi: number, ri: number) => {
    const remaining = groups[gi].filter((_, j) => j !== ri);
    update(
      remaining.length === 0
        ? groups.filter((_, i) => i !== gi)
        : groups.map((g, i) => (i === gi ? remaining : g)),
    );
  };

  return (
    <div
      id={id}
      className="flex flex-col gap-[2.136vw] tablet:gap-[1vw] desktop:gap-[0.416vw]"
    >
      {groups.map((group, gi) => (
        <div
          key={gi}
          className="flex flex-col gap-[2.136vw] tablet:gap-[1vw] desktop:gap-[0.416vw]"
        >
          {gi > 0 && (
            <span className="text-[2.937vw] tablet:text-[1.375vw] desktop:text-[0.572vw] font-medium uppercase text-muted-foreground">
              {C.or}
            </span>
          )}
          <div className="flex flex-col gap-[2.136vw] tablet:gap-[1vw] desktop:gap-[0.416vw] rounded-[2.67vw] tablet:rounded-[1.25vw] desktop:rounded-[0.52vw] border border-border p-[2.136vw] tablet:p-[1vw] desktop:p-[0.416vw]">
            {group.map((cond, ri) => {
              const op = opOf(cond);
              const text = valueText(cond, op);
              const fieldNames = isValidityOp(op) ? builtinNames : names;
              return (
                <div
                  key={ri}
                  className="flex flex-col gap-[1.602vw] tablet:gap-[0.75vw] desktop:gap-[0.312vw]"
                >
                  {ri > 0 && (
                    <span className="text-[2.937vw] tablet:text-[1.375vw] desktop:text-[0.572vw] font-medium uppercase text-muted-foreground">
                      {C.and}
                    </span>
                  )}
                  <div className="flex items-center gap-[1.602vw] tablet:gap-[0.75vw] desktop:gap-[0.312vw]">
                    <Select
                      value={cond.field}
                      onValueChange={(f) => setRow(gi, ri, build(f, op, text))}
                    >
                      <SelectTrigger
                        aria-label={C.fieldAriaLabel}
                        className="flex-1"
                      >
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
                  <div className="flex items-center gap-[1.602vw] tablet:gap-[0.75vw] desktop:gap-[0.312vw]">
                    <Select
                      value={op}
                      onValueChange={(next) => {
                        const nextOp = next as Op;
                        const field =
                          isValidityOp(nextOp) &&
                          !builtinNames.includes(cond.field)
                            ? (builtinNames[0] ?? cond.field)
                            : cond.field;
                        setRow(gi, ri, build(field, nextOp, text));
                      }}
                    >
                      <SelectTrigger
                        aria-label={C.operatorAriaLabel}
                        className="w-[34.71vw] tablet:w-[16.25vw] desktop:w-[6.76vw]"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="equals">{C.ops.equals}</SelectItem>
                        <SelectItem value="notEquals">
                          {C.ops.notEquals}
                        </SelectItem>
                        <SelectItem value="in">{C.ops.in}</SelectItem>
                        {validityOps && (
                          <SelectItem value="isValid">
                            {C.ops.isValid}
                          </SelectItem>
                        )}
                        {validityOps && (
                          <SelectItem value="isInvalid">
                            {C.ops.isInvalid}
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    {!isValidityOp(op) && (
                      <Input
                        aria-label={C.valueAriaLabel}
                        value={text}
                        placeholder={
                          op === "in" ? C.inPlaceholder : C.valuePlaceholder
                        }
                        onChange={(e) =>
                          setRow(gi, ri, build(cond.field, op, e.target.value))
                        }
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
              onClick={() =>
                update(groups.map((g, i) => (i === gi ? [...g, seed()] : g)))
              }
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
