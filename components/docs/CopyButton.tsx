"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { docs } from "@/locales/en/docs";
import { fmt } from "@/locales/fmt";

type CopyButtonProps = {
  text: string;
  label?: string;
  className?: string;
};

const COPIED_RESET_MS = 2000;

export function CopyButton({ text, label = docs.codeBlock.defaultLabel, className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    },
    [],
  );

  const copy = async () => {
    if (typeof navigator === "undefined" || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setCopied(false), COPIED_RESET_MS);
    } catch {
    }
  };

  const idleText = fmt(docs.codeBlock.copyAriaLabel, { label });
  const stateText = copied ? docs.codeBlock.copied : idleText;

  return (
    <Button
      type="button"
      variant="outline"
      size="icon-sm"
      onClick={copy}
      aria-label={stateText}
      title={stateText}
      className={cn("bg-background", className)}
    >
      {copied ? <Check /> : <Copy />}
      <span role="status" aria-live="polite" className="sr-only">
        {copied ? docs.codeBlock.copied : ""}
      </span>
    </Button>
  );
}
