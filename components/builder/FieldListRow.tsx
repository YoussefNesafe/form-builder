"use client";

import { ChevronDown, ChevronUp, Copy, Trash2 } from "lucide-react";
import type { FieldType } from "@/form-builder";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useBuilderStore } from "./model/store";
import { FIELD_META } from "./model/fieldMeta";
import { FieldIcon } from "./ui/FieldIcon";
import { AddFieldMenu } from "./AddFieldMenu";
import type { BuilderNode } from "./model/types";

/** One field in the list. Recurses to render `group` children indented. */
export function FieldListRow({ node, depth = 0 }: { node: BuilderNode; depth?: number }) {
  const selectedId = useBuilderStore((s) => s.selectedId);
  const selectNode = useBuilderStore((s) => s.selectNode);
  const moveNode = useBuilderStore((s) => s.moveNode);
  const duplicateNode = useBuilderStore((s) => s.duplicateNode);
  const removeNode = useBuilderStore((s) => s.removeNode);
  const addNode = useBuilderStore((s) => s.addNode);

  const selected = selectedId === node._id;
  const name = (node.props.name as string) || "(unnamed)";
  const label = (node.props.label as string) || "";

  return (
    <div className="flex flex-col gap-[4px] tablet:gap-[4px] desktop:gap-[4px]">
      <div
        role="button"
        tabIndex={0}
        onClick={() => selectNode(node._id)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            selectNode(node._id);
          }
        }}
        className={cn(
          "group flex items-center gap-[8px] tablet:gap-[8px] desktop:gap-[8px] rounded-[10px] tablet:rounded-[10px] desktop:rounded-[10px] border px-[8px] tablet:px-[8px] desktop:px-[8px] py-[6px] tablet:py-[6px] desktop:py-[6px] cursor-pointer transition-colors outline-none focus-visible:border-ring",
          selected ? "border-primary bg-muted" : "border-border hover:bg-muted/50",
        )}
      >
        <FieldIcon type={node.type as FieldType} className="shrink-0 text-muted-foreground" />
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-[13px] tablet:text-[13px] desktop:text-[13px] font-medium">
            {label || name}
          </span>
          <span className="truncate text-[11px] tablet:text-[11px] desktop:text-[11px] text-muted-foreground">
            {FIELD_META[node.type as FieldType].label} · {name}
          </span>
        </div>
        <div className="flex items-center opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
          <RowAction label="Move up" onClick={() => moveNode(node._id, -1)}>
            <ChevronUp />
          </RowAction>
          <RowAction label="Move down" onClick={() => moveNode(node._id, 1)}>
            <ChevronDown />
          </RowAction>
          <RowAction label="Duplicate" onClick={() => duplicateNode(node._id)}>
            <Copy />
          </RowAction>
          <RowAction label="Delete" destructive onClick={() => removeNode(node._id)}>
            <Trash2 />
          </RowAction>
        </div>
      </div>

      {node.type === "group" && (
        <div className="ml-[16px] tablet:ml-[16px] desktop:ml-[16px] flex flex-col gap-[4px] tablet:gap-[4px] desktop:gap-[4px] border-l border-border pl-[8px] tablet:pl-[8px] desktop:pl-[8px]">
          {(node.children ?? []).map((child) => (
            <FieldListRow key={child._id} node={child} depth={depth + 1} />
          ))}
          <AddFieldMenu size="xs" label="Add to group" onPick={(type) => addNode(type, node._id)} />
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
      className={destructive ? "text-muted-foreground hover:text-destructive" : "text-muted-foreground"}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      {children}
    </Button>
  );
}
