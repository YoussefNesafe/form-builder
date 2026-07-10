// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { renderRichText } from "./richText";

afterEach(cleanup);

function draw(content: string) {
  return render(<div data-testid="rt">{renderRichText(content)}</div>);
}

// NUL byte built in code so no invisible control char lives in the source.
const NUL = String.fromCharCode(0);

describe("renderRichText", () => {
  it("returns plain text unchanged", () => {
    draw("Just some text");
    expect(screen.getByTestId("rt").textContent).toBe("Just some text");
  });

  it("renders a safe anchor with its href and text, keeping surrounding text", () => {
    draw('Read the <a href="https://example.com/terms">terms</a> now');
    const link = screen.getByRole("link", { name: "terms" });
    expect(link.getAttribute("href")).toBe("https://example.com/terms");
    expect(screen.getByTestId("rt").textContent).toBe("Read the terms now");
  });

  it("hardens target=_blank with rel", () => {
    draw('<a href="https://x.com" target="_blank">x</a>');
    const link = screen.getByRole("link");
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toBe("noopener noreferrer");
  });

  it("allows relative and hash and mailto hrefs", () => {
    draw('<a href="/page">a</a> <a href="#top">b</a> <a href="mailto:x@y.com">c</a>');
    expect(screen.getAllByRole("link")).toHaveLength(3);
  });

  it("drops a javascript: link but keeps its text (no anchor rendered)", () => {
    draw('click <a href="javascript:alert(1)">here</a>');
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getByTestId("rt").textContent).toBe("click here");
  });

  it("drops an href containing a control char (NUL scheme smuggling)", () => {
    draw(`x <a href="jav${NUL}ascript:alert(1)">y</a> z`);
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getByTestId("rt").textContent).toBe("x y z");
  });

  it("extracts the real href, not a data-href attribute", () => {
    draw('<a data-href="javascript:alert(1)" href="https://ok.com">x</a>');
    expect(screen.getByRole("link").getAttribute("href")).toBe("https://ok.com");
  });

  it("does not execute or render script/other tags — they stay literal text", () => {
    draw('<script>alert(1)</script> and <b>bold</b>');
    expect(screen.getByTestId("rt").querySelector("script")).toBeNull();
    expect(screen.getByTestId("rt").querySelector("b")).toBeNull();
    expect(screen.getByTestId("rt").textContent).toContain("<script>alert(1)</script>");
  });

  it("renders <br> as a line break", () => {
    draw("line1<br>line2");
    expect(screen.getByTestId("rt").querySelector("br")).not.toBeNull();
  });

  it("ignores non-href attributes like onclick", () => {
    draw('<a href="https://x.com" onclick="alert(1)">x</a>');
    const link = screen.getByRole("link");
    expect(link.getAttribute("onclick")).toBeNull();
  });
});
