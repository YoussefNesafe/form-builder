"use client";

import { Separator } from "@/components/ui/separator";
import type { FieldComponentProps } from "../core/registry";
import type { FieldConfig } from "../core/types";
import { renderRichText } from "./richText";

type StaticFieldConfig = Extract<FieldConfig, { type: "static" }>;

export function StaticField({ field }: FieldComponentProps) {
  const config = field as StaticFieldConfig;
  const content = renderRichText(config.content);

  switch (config.as) {
    case "h1":
      return (
        <h1 className="text-[var(--fb-space-15,8.01vw)] tablet:text-[var(--fb-space-15-tablet,3.75vw)] desktop:text-[var(--fb-space-15-desktop,1.56vw)] font-semibold">
          {content}
        </h1>
      );
    case "h2":
      return (
        <h2 className="text-[var(--fb-space-10,5.34vw)] tablet:text-[var(--fb-space-10-tablet,2.5vw)] desktop:text-[var(--fb-space-10-desktop,1.04vw)] font-semibold">
          {content}
        </h2>
      );
    case "divider":
      return <Separator />;
    default:
      return <p className="text-muted-foreground">{content}</p>;
  }
}
