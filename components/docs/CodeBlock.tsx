import { cn } from "@/lib/utils";

type CodeBlockProps = {
  code: string;
  className?: string;
  /** Accessible name for the scrollable region — keyboard/SR users need one to reach it. */
  label?: string;
};

/**
 * Static `<pre><code>` block for docs code samples. No syntax highlighting —
 * Phase 1 docs are plain TSX pages with no new deps (no MDX/highlighter
 * tooling). `dir="ltr"` matches the /examples config/output blocks: code
 * must stay left-to-right even when the site renders RTL (components.json
 * sets `rtl: true`). `tabIndex={0}` + `aria-label` make the horizontally
 * scrollable region keyboard-reachable (WCAG 2.1.1) instead of mouse-only.
 */
export function CodeBlock({ code, className, label = "Code example" }: CodeBlockProps) {
  return (
    <pre
      dir="ltr"
      tabIndex={0}
      aria-label={label}
      className={cn(
        "overflow-x-auto rounded-[10px] tablet:rounded-[10px] desktop:rounded-[10px] border border-border bg-muted p-[14px] tablet:p-[14px] desktop:p-[14px] text-[12.5px] tablet:text-[12.5px] desktop:text-[12.5px] font-mono leading-relaxed",
        className,
      )}
    >
      <code>{code}</code>
    </pre>
  );
}
