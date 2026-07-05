"use client";

import { Separator } from "@/components/ui/separator";
import type { FieldComponentProps } from "../core/registry";
import type { FieldConfig } from "../core/types";

type StaticFieldConfig = Extract<FieldConfig, { type: "static" }>;

export function StaticField({ field }: FieldComponentProps) {
  const config = field as StaticFieldConfig;

  switch (config.as) {
    case "h1":
      return <h1 className="text-3xl font-semibold">{config.content}</h1>;
    case "h2":
      return <h2 className="text-xl font-semibold">{config.content}</h2>;
    case "divider":
      return <Separator />;
    default:
      return <p className="text-muted-foreground">{config.content}</p>;
  }
}
