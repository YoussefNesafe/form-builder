import { Fragment, type ReactNode } from "react";

export function splitLineComment(line: string): { code: string; comment: string | null } {
  let quote: string | null = null;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quote) {
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
