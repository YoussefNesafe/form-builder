"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { docs } from "@/locales/en/docs";
import { fmt } from "@/locales/fmt";

type CopyButtonProps = {
  /** Exact text written to the clipboard — pass the same string/constant the code block renders, never a re-derived copy. */
  text: string;
  /** Noun for the accessible name, e.g. "command" or "CSS" — defaults to "code" (docs.codeBlock.defaultLabel). */
  label?: string;
  className?: string;
};

const COPIED_RESET_MS = 2000;

/**
 * Icon copy-to-clipboard button, extracted from the inline copy() in
 * components/builder/CodeOutputPanel.tsx (same navigator.clipboard.writeText
 * + transient-state pattern) so the docs installation page can reuse it
 * instead of re-implementing it. Only 2 surfaces consume it (builder, docs)
 * — below the 3-surface bar for components/shared/ per AGENTS.md, so it
 * lives here; CodeOutputPanel still owns its own toolbar-style Copy/Copied
 * text button (different layout — inline label, not an icon overlay) and
 * was left as-is rather than forced onto this variant.
 *
 * Client island: the parent CodeBlock stays a Server Component, only this
 * leaf ships JS. navigator.clipboard is unavailable in non-secure contexts
 * (plain http://, no TLS) — guarded so it no-ops instead of throwing.
 */
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
      // Clipboard write blocked (permissions, insecure context) — no-op, button stays usable.
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
      {/* Redundant with the aria-label swap above for most screen readers, but a few (older
          NVDA/JAWS combos) don't reliably re-announce a focused control's own label change —
          this polite live region is the belt-and-suspenders confirmation. */}
      <span role="status" aria-live="polite" className="sr-only">
        {copied ? docs.codeBlock.copied : ""}
      </span>
    </Button>
  );
}
