"use client";

import { useMemo, useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { builder } from "@/locales/en/builder";
import { fmt } from "@/locales/fmt";
import { useBuilderStore } from "./model/store";
import { useSerializedConfig } from "./model/useSerializedConfig";
import { toCode } from "./model/serializeCode";
import type { OutputMode } from "./model/types";

const COPIED_RESET_MS = 1500;

const MODES: { value: OutputMode; label: string }[] = [
  { value: "ts", label: builder.output.modeTs },
  { value: "json", label: builder.output.modeJson },
];

export function CodeOutputPanel() {
  const nodes = useBuilderStore((s) => s.nodes);
  const outputMode = useBuilderStore((s) => s.outputMode);
  const setOutputMode = useBuilderStore((s) => s.setOutputMode);
  const [copied, setCopied] = useState(false);

  const { config, error: validationError } = useSerializedConfig();
  const code = useMemo(() => toCode(config, outputMode), [config, outputMode]);
  const error =
    nodes.length === 0 ? builder.output.addAtLeastOneField : validationError;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), COPIED_RESET_MS);
    } catch {
    }
  };

  return (
    <div className="flex min-h-0 min-w-0 flex-col gap-[3.204vw] tablet:gap-[1.5vw] desktop:gap-[0.624vw]">
      <div className="flex items-center justify-between gap-[2.136vw] tablet:gap-[1vw] desktop:gap-[0.416vw]">
        <SegmentedControl
          aria-label={builder.output.formatAriaLabel}
          options={MODES}
          value={outputMode}
          onChange={setOutputMode}
        />
        <Button variant="outline" size="sm" onClick={copy}>
          {copied ? <Check /> : <Copy />}
          {copied ? builder.output.copied : builder.output.copy}
        </Button>
      </div>

      {error && (
        <p
          role="status"
          className="rounded-[2.67vw] tablet:rounded-[1.25vw] desktop:rounded-[0.52vw] border border-destructive/40 bg-destructive/10 px-[2.67vw] tablet:px-[1.25vw] desktop:px-[0.52vw] py-[1.602vw] tablet:py-[0.75vw] desktop:py-[0.312vw] text-[3.204vw] tablet:text-[1.5vw] desktop:text-[0.624vw] text-destructive"
        >
          {fmt(builder.output.notValidYet, { error })}
        </p>
      )}

      <pre
        dir="ltr"
        className="w-full min-w-0 max-h-[112.14vw] tablet:max-h-[52.5vw] desktop:max-h-[21.84vw] overflow-y-auto whitespace-pre-wrap [overflow-wrap:anywhere] rounded-[2.67vw] tablet:rounded-[1.25vw] desktop:rounded-[0.52vw] border border-border bg-muted p-[3.204vw] tablet:p-[1.5vw] desktop:p-[0.624vw] text-[3.204vw] tablet:text-[1.5vw] desktop:text-[0.624vw]"
      >
        {code}
      </pre>
    </div>
  );
}
