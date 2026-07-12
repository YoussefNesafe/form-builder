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
  const error = nodes.length === 0 ? builder.output.addAtLeastOneField : validationError;

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
    <div className="flex min-h-0 flex-col gap-[12px] tablet:gap-[12px] desktop:gap-[12px]">
      <div className="flex items-center justify-between gap-[8px] tablet:gap-[8px] desktop:gap-[8px]">
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
          title/description split) that sits between rounded-[10px] neighbors
          (the format toggle above, the code block below) — Alert's normalized
          rounded-[12px] would clash with that 10px context. Staff-approved
          call site exemption; see the Slice 4 review. */}
      {error && (
        <p
          role="status"
          className="rounded-[10px] tablet:rounded-[10px] desktop:rounded-[10px] border border-destructive/40 bg-destructive/10 px-[10px] tablet:px-[10px] desktop:px-[10px] py-[6px] tablet:py-[6px] desktop:py-[6px] text-[12px] tablet:text-[12px] desktop:text-[12px] text-destructive"
        >
          {fmt(builder.output.notValidYet, { error })}
        </p>
      )}

      <pre
        dir="ltr"
        className="max-h-[420px] tablet:max-h-[420px] desktop:max-h-[420px] overflow-auto rounded-[10px] tablet:rounded-[10px] desktop:rounded-[10px] border border-border bg-muted p-[12px] tablet:p-[12px] desktop:p-[12px] text-[12px] tablet:text-[12px] desktop:text-[12px]"
      >
        {code}
      </pre>
    </div>
  );
}
