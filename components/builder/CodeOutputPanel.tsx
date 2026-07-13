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

const MODES: { value: OutputMode; label: string }[] = [
  { value: "ts", label: builder.output.modeTs },
  { value: "json", label: builder.output.modeJson },
];

/** Generated config output with a TS/JSON toggle, copy button, and validity note. */
export function CodeOutputPanel() {
  const nodes = useBuilderStore((s) => s.nodes);
  const outputMode = useBuilderStore((s) => s.outputMode);
  const setOutputMode = useBuilderStore((s) => s.setOutputMode);
  const [copied, setCopied] = useState(false);

  const { config, error: validationError } = useSerializedConfig();
  const code = useMemo(() => toCode(config, outputMode), [config, outputMode]);
  // useSerializedConfig skips validation (error: null) while there are no
  // fields yet — this pane, unlike PreviewPanel, still needs a message for that case.
  const error =
    nodes.length === 0 ? builder.output.addAtLeastOneField : validationError;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard blocked (e.g. insecure context) — no-op
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

      {/* Deliberately NOT the shared `Alert` primitive (components/ui/alert.tsx):
          this note is a single-line, structurally distinct callout (no
          title/description split) that sits between rounded-[2.67vw] neighbors
          (the format toggle above, the code block below) — Alert's normalized
          rounded-[3.204vw] would clash with that 10px context. Staff-approved
          call site exemption; see the Slice 4 review. */}
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
