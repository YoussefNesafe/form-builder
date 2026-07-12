"use client";

import { ChevronDown, ChevronUp, Copy, Trash2 } from "lucide-react";
import type { FieldType } from "@/form-builder";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { builder } from "@/locales/en/builder";
import { fmt } from "@/locales/fmt";
import { fieldTypes } from "@/locales/en/fieldTypes";
import { useBuilderStore } from "./model/store";
import { isStepEligible } from "./model/defaults";
import { FieldIcon } from "./ui/FieldIcon";
import { AddFieldMenu } from "./AddFieldMenu";
import type { BuilderNode } from "./model/types";

const UNASSIGNED = "__unassigned__";

/** One field in the list. Recurses to render `group` children indented. */
export function FieldListRow({
  node,
  topLevel = true,
}: {
  node: BuilderNode;
  topLevel?: boolean;
}) {
  const selectedId = useBuilderStore((s) => s.selectedId);
  const selectNode = useBuilderStore((s) => s.selectNode);
  const moveNode = useBuilderStore((s) => s.moveNode);
  const duplicateNode = useBuilderStore((s) => s.duplicateNode);
  const removeNode = useBuilderStore((s) => s.removeNode);
  const addNode = useBuilderStore((s) => s.addNode);
  const multiStep = useBuilderStore((s) => s.multiStep);
  const steps = useBuilderStore((s) => s.steps);
  const assignNodeToStep = useBuilderStore((s) => s.assignNodeToStep);

  const selected = selectedId === node._id;
  // hidden/submit render automatically and must not be assigned to a step.
  const stepEligible = isStepEligible(node.type);
  const assignedStep = steps.findIndex((s) => s.nodeIds.includes(node._id));
  const showStepSelect =
    multiStep && topLevel && stepEligible && steps.length > 0;
  const name = (node.props.name as string) || builder.fieldList.unnamed;
  const label = (node.props.label as string) || "";

  return (
    <div className="flex flex-col gap-[1.068vw] tablet:gap-[0.5vw] desktop:gap-[0.208vw]">
      <div
        role="button"
        tabIndex={0}
        onClick={() => selectNode(node._id)}
        onKeyDown={(e) => {
          // Only the row itself activates — never swallow Enter/Space aimed at a
          // nested action button (that would cancel the button's default action).
          if (e.target !== e.currentTarget) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            selectNode(node._id);
          }
        }}
        className={cn(
          "group flex items-center gap-[2.136vw] tablet:gap-[1vw] desktop:gap-[0.416vw] rounded-[2.67vw] tablet:rounded-[1.25vw] desktop:rounded-[0.52vw] border px-[2.136vw] tablet:px-[1vw] desktop:px-[0.416vw] py-[1.602vw] tablet:py-[0.75vw] desktop:py-[0.312vw] cursor-pointer transition-colors outline-none focus-visible:border-ring",
          selected
            ? "border-primary bg-muted"
            : "border-border hover:bg-muted/50",
        )}
      >
        <FieldIcon
          type={node.type as FieldType}
          className="shrink-0 text-muted-foreground"
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-[3.471vw] tablet:text-[1.625vw] desktop:text-[0.676vw] font-medium">
            {label || name}
          </span>
          <span className="truncate text-[2.937vw] tablet:text-[1.375vw] desktop:text-[0.572vw] text-muted-foreground">
            {fieldTypes[node.type as FieldType].label} · {name}
          </span>
        </div>
        <div className="flex items-center opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
          <RowAction
            label={builder.fieldList.actions.moveUp}
            onClick={() => moveNode(node._id, -1)}
          >
            <ChevronUp />
          </RowAction>
          <RowAction
            label={builder.fieldList.actions.moveDown}
            onClick={() => moveNode(node._id, 1)}
          >
            <ChevronDown />
          </RowAction>
          <RowAction
            label={builder.fieldList.actions.duplicate}
            onClick={() => duplicateNode(node._id)}
          >
            <Copy />
          </RowAction>
          <RowAction
            label={builder.fieldList.actions.delete}
            destructive
            onClick={() => removeNode(node._id)}
          >
            <Trash2 />
          </RowAction>
        </div>
      </div>

      {showStepSelect && (
        <Select
          value={assignedStep >= 0 ? String(assignedStep) : UNASSIGNED}
          onValueChange={(v) =>
            assignNodeToStep(node._id, v === UNASSIGNED ? null : Number(v))
          }
        >
          <SelectTrigger
            aria-label={fmt(builder.fieldList.stepAriaLabel, { name })}
            size="sm"
            className={cn(
              "w-full",
              assignedStep < 0 && "border-destructive/50",
            )}
          >
            <SelectValue placeholder={builder.fieldList.assignToStep} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={UNASSIGNED}>
              {builder.fieldList.unassigned}
            </SelectItem>
            {steps.map((s, i) =>
              // Review steps own no fields — not an assignment target.
              s.review ? null : (
                <SelectItem key={i} value={String(i)}>
                  {s.title || fmt(builder.fieldList.stepFallback, { n: i + 1 })}
                </SelectItem>
              ),
            )}
          </SelectContent>
        </Select>
      )}

      {node.type === "group" && (
        <div className="ml-[4.272vw] tablet:ml-[2vw] desktop:ml-[0.832vw] flex flex-col gap-[1.068vw] tablet:gap-[0.5vw] desktop:gap-[0.208vw] border-l border-border pl-[2.136vw] tablet:pl-[1vw] desktop:pl-[0.416vw]">
          {(node.children ?? []).map((child) => (
            <FieldListRow key={child._id} node={child} topLevel={false} />
          ))}
          <AddFieldMenu
            size="xs"
            label={builder.fieldList.addToGroup}
            onPick={(type) => addNode(type, node._id)}
          />
        </div>
      )}
    </div>
  );
}

function RowAction({
  label,
  onClick,
  destructive,
  children,
}: {
  label: string;
  onClick: () => void;
  destructive?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Button
      variant="ghost"
      size="icon-xs"
      aria-label={label}
      title={label}
      className={
        destructive
          ? "text-muted-foreground hover:text-destructive"
          : "text-muted-foreground"
      }
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      {children}
    </Button>
  );
}
