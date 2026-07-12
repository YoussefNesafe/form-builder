import { cn } from "@/lib/utils";
import { CopyButton } from "./CopyButton";
import {
  CODE_BLOCK_CONTAINER_CLASS,
  CODE_BLOCK_COPY_PADDING_CLASS,
  CODE_BLOCK_PADDING_CLASS,
  CODE_BLOCK_TEXT_CLASS,
} from "./codeBlockStyles";

type CodeBlockProps = {
  code: string;
  className?: string;
  /** Accessible name for the scrollable region — keyboard/SR users need one to reach it. */
  label?: string;
  /**
   * Renders a copy-to-clipboard button in the corner. Opt-in per call site
   * (default false) — most CodeBlock usages (conditions/wizards/your-first-
   * form pages, the landing page's BuilderCodeSplit) are read-along examples,
   * not text meant to be pasted, so they're left unchanged. The installation
   * page turns this on for its terminal/CSS/import blocks (see its sections).
   */
  copy?: boolean;
  /** Noun for the copy button's accessible name, e.g. "command" or "CSS" — defaults to "code". Only used when `copy` is true. */
  copyLabel?: string;
};

/**
 * Static `<pre><code>` block for docs code samples. No syntax highlighting —
 * Phase 1 docs are plain TSX pages with no new deps (no MDX/highlighter
 * tooling). `dir="ltr"` matches the /examples config/output blocks: code
 * must stay left-to-right even when the site renders RTL (components.json
 * sets `rtl: true`). `tabIndex={0}` + `aria-label` make the horizontally
 * scrollable region keyboard-reachable (WCAG 2.1.1) instead of mouse-only.
 */
export function CodeBlock({ code, className, label = "Code example", copy = false, copyLabel }: CodeBlockProps) {
  return (
    <div className="relative">
      <pre
        dir="ltr"
        tabIndex={0}
        aria-label={label}
        className={cn(
          "overflow-x-auto",
          CODE_BLOCK_CONTAINER_CLASS,
          CODE_BLOCK_PADDING_CLASS,
          CODE_BLOCK_TEXT_CLASS,
          copy && CODE_BLOCK_COPY_PADDING_CLASS,
          className,
        )}
      >
        <code>{code}</code>
      </pre>
      {copy && (
        <CopyButton
          text={code}
          label={copyLabel}
          className="absolute top-[6px] right-[6px] tablet:top-[6px] tablet:right-[6px] desktop:top-[6px] desktop:right-[6px]"
        />
      )}
    </div>
  );
}
