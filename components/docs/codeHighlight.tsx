import { Fragment, type ReactNode } from "react";

/**
 * Minimal, dependency-free comment de-emphasis for docs code samples. NOT a
 * syntax highlighter (that decision — "no new deps, no MDX/highlighter tooling"
 * — stands; see CodeBlock.tsx): docs snippets are short, hand-authored TSX
 * strings dominated by a single explanatory `// comment` line whose only job is
 * to caption the block. Dimming that comment to `text-muted-foreground`
 * separates "this explains" from "this executes" — the bulk of what a
 * highlighter would buy here — for the cost of one regex-free char scan.
 *
 * Colour is decoration, never the sole signal (WCAG 1.4.1): the comment text
 * still reads verbatim; dimming only lowers its visual weight. Contrast holds —
 * muted-foreground (oklch 0.708) on bg-muted (oklch 0.269) ≈ 5.8:1 on the
 * dark-only site (L³ relative-luminance approximation, same method the
 * globals.css token-contrast notes use), above the 4.5:1 floor (WCAG 1.4.3).
 */

/**
 * Split a single line at the first `//` that is NOT inside a string literal, so
 * a `//` inside `"https://…"` is never mistaken for a comment. Returns the code
 * part (leading indentation preserved) and the comment (from `//` to EOL), or
 * `comment: null` when the line has no trailing/standalone comment.
 *
 * Single-line only: string/template state is not carried across lines, so a
 * multi-line string literal whose continuation line contains `//` would be
 * misread as a comment. Docs snippets are hand-authored and one-line-per-string
 * (no sample triggers this), so the caller splits on `\n` and applies this
 * per line — acceptable for the corpus, not a general tokenizer.
 */
export function splitLineComment(line: string): { code: string; comment: string | null } {
  let quote: string | null = null;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quote) {
      // Skip the char after a backslash so an escaped quote (\") doesn't close
      // the string early.
      if (ch === "\\") {
        i++;
        continue;
      }
      if (ch === quote) quote = null;
    } else if (ch === '"' || ch === "'" || ch === "`") {
      quote = ch;
    } else if (ch === "/" && line[i + 1] === "/") {
      return { code: line.slice(0, i), comment: line.slice(i) };
    }
  }
  return { code: line, comment: null };
}

/**
 * Render a code string with `//` comments wrapped in a dimmed span. Pure
 * text/markup — the returned nodes carry the exact same characters as the input
 * (no chars dropped, no aria-hidden), so screen readers read the block
 * unchanged. Newlines are re-emitted as text and preserved by the `<pre>`'s
 * `whitespace-pre-wrap`.
 */
export function renderCodeWithDimmedComments(code: string): ReactNode {
  const lines = code.split("\n");
  return lines.map((line, i) => {
    const { code: codePart, comment } = splitLineComment(line);
    return (
      <Fragment key={i}>
        {codePart}
        {comment !== null && <span className="text-muted-foreground">{comment}</span>}
        {i < lines.length - 1 ? "\n" : null}
      </Fragment>
    );
  });
}
