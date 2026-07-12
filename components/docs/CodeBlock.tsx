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
   * form pages, the landing page's showcase/flagship code peeks) are read-along examples,
   * not text meant to be pasted, so they're left unchanged. The installation
   * page turns this on for its terminal/CSS/import blocks (see its sections).
   */
  copy?: boolean;
  /** Noun for the copy button's accessible name, e.g. "command" or "CSS" — defaults to "code". Only used when `copy` is true. */
  copyLabel?: string;
  /**
   * Renders the block as inert decoration: `aria-hidden="true"`, no
   * `tabIndex`/`aria-label` on the `<pre>`. Use when the block sits inside an
   * already-labelled interactive ancestor (e.g. a LinkCard `<Link>`) — an
   * unlabelled focusable `<pre>` there would be a dead second tab stop, and
   * its text would otherwise concatenate into the ancestor's accessible
   * name. Default false. Implies no copy button even if `copy` is true —
   * nothing in a decorative peek is meant to be individually copyable.
   */
  decorative?: boolean;
};

/**
 * Static `<pre><code>` block for docs code samples. No syntax highlighting —
 * Phase 1 docs are plain TSX pages with no new deps (no MDX/highlighter
 * tooling). `dir="ltr"` matches the /examples config/output blocks: code
 * must stay left-to-right even when the site renders RTL (components.json
 * sets `rtl: true`). `tabIndex={0}` + `aria-label` make the horizontally
 * scrollable region keyboard-reachable (WCAG 2.1.1) instead of mouse-only —
 * skipped when `decorative` is set (see that prop's doc).
 */
export function CodeBlock({
  code,
  className,
  label = "Code example",
  copy = false,
  copyLabel,
  decorative = false,
}: CodeBlockProps) {
  return (
    <div className="relative">
      <pre
        dir="ltr"
        tabIndex={decorative ? undefined : 0}
        role={decorative ? undefined : "group"}
        aria-label={decorative ? undefined : label}
        aria-hidden={decorative ? "true" : undefined}
        className={cn(
          // Decorative peeks clip instead of scrolling: they're aria-hidden and
          // unfocusable, so a horizontal scroll region there would be
          // mouse-only (and inside a LinkCard the drag would fight the link).
          decorative ? "overflow-hidden" : "overflow-x-auto",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground",
          CODE_BLOCK_CONTAINER_CLASS,
          CODE_BLOCK_PADDING_CLASS,
          CODE_BLOCK_TEXT_CLASS,
          copy && !decorative && CODE_BLOCK_COPY_PADDING_CLASS,
          className,
        )}
      >
        <code>{code}</code>
      </pre>
      {copy && !decorative && (
        <CopyButton
          text={code}
          label={copyLabel}
          className="absolute top-[1.602vw] right-[1.602vw] tablet:top-[0.75vw] tablet:right-[0.75vw] desktop:top-[0.312vw] desktop:right-[0.312vw]"
        />
      )}
    </div>
  );
}
