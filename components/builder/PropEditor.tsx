"use client";

import { Trash2 } from "lucide-react";
import type { FieldType } from "@/form-builder";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { builder } from "@/locales/en/builder";
import { fieldTypes } from "@/locales/en/fieldTypes";
import { useBuilderStore } from "./model/store";
import { FIELD_PROPS, type PropDescriptor } from "./model/fieldProps";
import { findContext, visibleDescriptors } from "./model/context";
import { FieldIcon } from "./ui/FieldIcon";
import { PanelHeading } from "./ui/PanelHeading";
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
import { OptionsFromEditor } from "./controls/OptionsFromEditor";
import { ConditionEditor } from "./controls/ConditionEditor";
import { WidthEditor } from "./controls/WidthEditor";
import { RulesEditor } from "./controls/RulesEditor";
import { ComplexityEditor } from "./controls/ComplexityEditor";
import {
  CountryCodeControl,
  CountryListControl,
} from "./controls/CountryControls";
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
  optionsFrom: OptionsFromEditor,
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
      <div className="flex h-full flex-col gap-[3.204vw] tablet:gap-[1.5vw] desktop:gap-[0.624vw]">
        <PanelHeading>{builder.props.heading}</PanelHeading>
        <p className="text-[3.471vw] tablet:text-[1.625vw] desktop:text-[0.676vw] text-muted-foreground">
          {builder.props.selectPrompt}
        </p>
      </div>
    );
  }

  const { node, siblings, isNested } = ctxResult;
  const ctx: ControlContext = { node, siblings, isNested };
  const type = node.type as FieldType;
  const descriptors = visibleDescriptors(FIELD_PROPS[type], isNested);

  return (
    <div className="flex h-full flex-col gap-[3.204vw] tablet:gap-[1.5vw] desktop:gap-[0.624vw]">
      <PanelHeading>{builder.props.heading}</PanelHeading>
      <div className="flex items-center justify-between rounded-[2.67vw] tablet:rounded-[1.25vw] desktop:rounded-[0.52vw] border border-border px-[2.67vw] tablet:px-[1.25vw] desktop:px-[0.52vw] py-[2.136vw] tablet:py-[1vw] desktop:py-[0.416vw]">
        <div className="flex items-center gap-[2.136vw] tablet:gap-[1vw] desktop:gap-[0.416vw]">
          <FieldIcon type={type} className="text-muted-foreground" />
          <span className="text-[3.471vw] tablet:text-[1.625vw] desktop:text-[0.676vw] font-medium">
            {fieldTypes[type].label}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={builder.props.deleteFieldAriaLabel}
          className="text-muted-foreground hover:text-destructive"
          onClick={() => removeNode(node._id)}
        >
          <Trash2 />
        </Button>
      </div>

      <div className="flex flex-col gap-[3.738vw] tablet:gap-[1.75vw] desktop:gap-[0.728vw]">
        {descriptors.map((d) => {
          const Control = CONTROLS[d.control];
          const controlId = `prop-${d.key}`;
          const control = (
            <Control
              id={controlId}
              value={node.props[d.key]}
              onChange={(v) =>
                updateProps(node._id, {
                  [d.key]: v,
                  // Mutually exclusive props (disabledWhen/enabledWhen) —
                  // setting one clears the other or the engine rejects.
                  ...(v !== undefined && d.clears
                    ? Object.fromEntries(
                        d.clears.map((key) => [key, undefined]),
                      )
                    : {}),
                })
              }
              descriptor={d}
              ctx={ctx}
            />
          );

          if (INLINE_CONTROLS.has(d.control)) {
            return (
              <div
                key={d.key}
                className="flex items-center justify-between gap-[2.136vw] tablet:gap-[1vw] desktop:gap-[0.416vw]"
              >
                <Label
                  htmlFor={controlId}
                  className="text-[3.471vw] tablet:text-[1.625vw] desktop:text-[0.676vw]"
                >
                  {d.label}
                </Label>
                {control}
              </div>
            );
          }

          return (
            <div
              key={d.key}
              className="flex flex-col gap-[1.602vw] tablet:gap-[0.75vw] desktop:gap-[0.312vw]"
            >
              <Label
                htmlFor={controlId}
                className="text-[3.471vw] tablet:text-[1.625vw] desktop:text-[0.676vw]"
              >
                {d.label}
              </Label>
              {control}
              {d.help && (
                <p className="text-[2.937vw] tablet:text-[1.375vw] desktop:text-[0.572vw] text-muted-foreground">
                  {d.help}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
