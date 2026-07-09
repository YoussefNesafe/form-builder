"use client";

import { Trash2 } from "lucide-react";
import type { FieldType } from "@/form-builder";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useBuilderStore } from "./model/store";
import { FIELD_META } from "./model/fieldMeta";
import { FIELD_PROPS, type PropDescriptor } from "./model/fieldProps";
import { findContext, visibleDescriptors } from "./model/context";
import { FieldIcon } from "./ui/FieldIcon";
import {
  BooleanControl,
  DateControl,
  FieldRefControl,
  JsonControl,
  MaskControl,
  NumberControl,
  PenColorControl,
  SelectControl,
  TextareaControl,
  TextControl,
  TimeControl,
} from "./controls/primitives";
import { OptionsEditor } from "./controls/OptionsEditor";
import { ConditionEditor } from "./controls/ConditionEditor";
import { WidthEditor } from "./controls/WidthEditor";
import { RulesEditor } from "./controls/RulesEditor";
import { ComplexityEditor } from "./controls/ComplexityEditor";
import { CountryCodeControl, CountryListControl } from "./controls/CountryControls";
import type { ControlContext, ControlProps } from "./controls/types";

// Heterogeneous controls (each ControlProps<T>) collapse to one dynamic type
// for dispatch — the descriptor guarantees the right control gets the right value.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyControl = (props: ControlProps<any>) => React.ReactNode;

const CONTROLS: Record<PropDescriptor["control"], AnyControl> = {
  text: TextControl,
  textarea: TextareaControl,
  number: NumberControl,
  boolean: BooleanControl,
  select: SelectControl,
  date: DateControl,
  time: TimeControl,
  penColor: PenColorControl,
  mask: MaskControl,
  json: JsonControl,
  fieldRef: FieldRefControl,
  options: OptionsEditor,
  condition: ConditionEditor,
  width: WidthEditor,
  rules: RulesEditor,
  complexity: ComplexityEditor,
  countryCode: CountryCodeControl,
  countryList: CountryListControl,
};

// Booleans read better with the label on the same row as the switch.
const INLINE_CONTROLS = new Set<PropDescriptor["control"]>(["boolean"]);

export function PropEditorPanel() {
  const selectedId = useBuilderStore((s) => s.selectedId);
  const nodes = useBuilderStore((s) => s.nodes);
  const updateProps = useBuilderStore((s) => s.updateProps);
  const removeNode = useBuilderStore((s) => s.removeNode);

  const ctxResult = selectedId ? findContext(nodes, selectedId) : null;

  if (!ctxResult) {
    return (
      <div className="flex h-full flex-col gap-[12px] tablet:gap-[12px] desktop:gap-[12px]">
        <PanelHeading />
        <p className="text-[13px] tablet:text-[13px] desktop:text-[13px] text-muted-foreground">
          Select a field to edit its properties.
        </p>
      </div>
    );
  }

  const { node, siblings, isNested } = ctxResult;
  const ctx: ControlContext = { node, siblings, isNested };
  const type = node.type as FieldType;
  const descriptors = visibleDescriptors(FIELD_PROPS[type], isNested);

  return (
    <div className="flex h-full flex-col gap-[12px] tablet:gap-[12px] desktop:gap-[12px]">
      <PanelHeading />
      <div className="flex items-center justify-between rounded-[10px] tablet:rounded-[10px] desktop:rounded-[10px] border border-border px-[10px] tablet:px-[10px] desktop:px-[10px] py-[8px] tablet:py-[8px] desktop:py-[8px]">
        <div className="flex items-center gap-[8px] tablet:gap-[8px] desktop:gap-[8px]">
          <FieldIcon type={type} className="text-muted-foreground" />
          <span className="text-[13px] tablet:text-[13px] desktop:text-[13px] font-medium">{FIELD_META[type].label}</span>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Delete field"
          className="text-muted-foreground hover:text-destructive"
          onClick={() => removeNode(node._id)}
        >
          <Trash2 />
        </Button>
      </div>

      <div className="flex flex-col gap-[14px] tablet:gap-[14px] desktop:gap-[14px]">
        {descriptors.map((d) => {
          const Control = CONTROLS[d.control];
          const controlId = `prop-${d.key}`;
          const control = (
            <Control
              id={controlId}
              value={node.props[d.key]}
              onChange={(v) => updateProps(node._id, { [d.key]: v })}
              descriptor={d}
              ctx={ctx}
            />
          );

          if (INLINE_CONTROLS.has(d.control)) {
            return (
              <div key={d.key} className="flex items-center justify-between gap-[8px] tablet:gap-[8px] desktop:gap-[8px]">
                <Label htmlFor={controlId} className="text-[13px] tablet:text-[13px] desktop:text-[13px]">
                  {d.label}
                </Label>
                {control}
              </div>
            );
          }

          return (
            <div key={d.key} className="flex flex-col gap-[6px] tablet:gap-[6px] desktop:gap-[6px]">
              <Label htmlFor={controlId} className="text-[13px] tablet:text-[13px] desktop:text-[13px]">
                {d.label}
              </Label>
              {control}
              {d.help && (
                <p className="text-[11px] tablet:text-[11px] desktop:text-[11px] text-muted-foreground">{d.help}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PanelHeading() {
  return (
    <h2 className="text-[13px] tablet:text-[13px] desktop:text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
      Properties
    </h2>
  );
}
