// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { renderCodeWithDimmedComments } from "./codeHighlight";

afterEach(cleanup);

describe("renderCodeWithDimmedComments", () => {
  it("preserves every character (screen-reader parity) across multiple lines", () => {
    const code = 'visibleWhen: [\n  { field: "country", equals: "US" }, // note\n]';
    const { container } = render(<pre>{renderCodeWithDimmedComments(code)}</pre>);
    // textContent must equal the input verbatim — no chars dropped or added.
    expect(container.textContent).toBe(code);
  });

  it("wraps the comment (and only the comment) in a muted span", () => {
    const { container } = render(
      <pre>{renderCodeWithDimmedComments('  { field: "x" }, // the x field')}</pre>,
    );
    const spans = container.querySelectorAll("span.text-muted-foreground");
    expect(spans).toHaveLength(1);
    expect(spans[0].textContent).toBe("// the x field");
  });

  it("emits no span for a comment-free line", () => {
    const { container } = render(
      <pre>{renderCodeWithDimmedComments('  { field: "country", equals: "US" },')}</pre>,
    );
    expect(container.querySelectorAll("span")).toHaveLength(0);
  });

  it("does not dim a // that lives inside a string literal", () => {
    const { container } = render(<pre>{renderCodeWithDimmedComments('  url: "https://x.com",')}</pre>);
    expect(container.querySelectorAll("span")).toHaveLength(0);
  });
});
