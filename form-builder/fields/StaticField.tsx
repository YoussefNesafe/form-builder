"use client";

import { Separator } from "@/components/ui/separator";
import type { FieldComponentProps } from "../core/registry";
import type { FieldConfig } from "../core/types";
import { renderRichText } from "./richText";

type StaticFieldConfig = Extract<FieldConfig, { type: "static" }>;

export function StaticField({ field }: FieldComponentProps) {
  const config = field as StaticFieldConfig;
  // content may carry an allowlisted inline <a href>/<br> (safe schemes only).
  const content = renderRichText(config.content);

  switch (config.as) {
    case "h1":
      return (
        <h1 className="text-[30px] tablet:text-[30px] desktop:text-[30px] font-semibold">
          {content}
        </h1>
      );
    case "h2":
      return (
        <h2 className="text-[20px] tablet:text-[20px] desktop:text-[20px] font-semibold">
          {content}
        </h2>
      );
    case "divider":
      return <Separator />;
    default:
      return <p className="text-muted-foreground">{content}</p>;
  }
}
