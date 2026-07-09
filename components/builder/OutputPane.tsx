"use client";

import { useMemo, useState } from "react";
import { Check, Copy } from "lucide-react";
import { validateFormConfig } from "@/form-builder/core/schema";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useBuilderStore } from "./model/store";
import { serialize } from "./model/serialize";
import { toCode } from "./model/serializeCode";
import type { OutputMode } from "./model/types";

const MODES: { value: OutputMode; label: string }[] = [
  { value: "ts", label: "TypeScript" },
  { value: "json", label: "JSON" },
];

/** Generated config output with a TS/JSON toggle, copy button, and validity note. */
export function OutputPane() {
  const title = useBuilderStore((s) => s.title);
  const description = useBuilderStore((s) => s.description);
  const nodes = useBuilderStore((s) => s.nodes);
  const multiStep = useBuilderStore((s) => s.multiStep);
  const steps = useBuilderStore((s) => s.steps);
  const outputMode = useBuilderStore((s) => s.outputMode);
  const setOutputMode = useBuilderStore((s) => s.setOutputMode);
  const [copied, setCopied] = useState(false);

  const config = useMemo(
    () => serialize({ title, description, nodes, multiStep, steps }),
    [title, description, nodes, multiStep, steps],
  );
  const code = useMemo(() => toCode(config, outputMode), [config, outputMode]);

  let error: string | null = null;
  if (nodes.length === 0) error = "Add at least one field.";
  else {
    try {
      validateFormConfig(config);
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    }
  }

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
        <div className="flex items-center gap-[4px] tablet:gap-[4px] desktop:gap-[4px] rounded-[10px] tablet:rounded-[10px] desktop:rounded-[10px] border border-border p-[2px] tablet:p-[2px] desktop:p-[2px]">
          {MODES.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => setOutputMode(m.value)}
              className={cn(
                "rounded-[8px] tablet:rounded-[8px] desktop:rounded-[8px] px-[10px] tablet:px-[10px] desktop:px-[10px] py-[4px] tablet:py-[4px] desktop:py-[4px] text-[13px] tablet:text-[13px] desktop:text-[13px]",
                outputMode === m.value ? "bg-muted text-foreground" : "text-muted-foreground",
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={copy}>
          {copied ? <Check /> : <Copy />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>

      {error && (
        <p className="rounded-[10px] tablet:rounded-[10px] desktop:rounded-[10px] border border-destructive/40 bg-destructive/10 px-[10px] tablet:px-[10px] desktop:px-[10px] py-[6px] tablet:py-[6px] desktop:py-[6px] text-[12px] tablet:text-[12px] desktop:text-[12px] text-destructive">
          Not valid yet: {error}
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
