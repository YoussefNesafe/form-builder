// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ResponsiveFieldWidth } from "@/form-builder";
import { WidthEditor } from "./WidthEditor";
import type { ControlContext } from "./types";

afterEach(cleanup);

const ctx = {} as ControlContext;
const descriptor = { key: "width", label: "Width", control: "width" as const };

function renderEditor(value: ResponsiveFieldWidth | undefined) {
  const onChange = vi.fn();
  render(<WidthEditor id="w" value={value} onChange={onChange} descriptor={descriptor} ctx={ctx} />);
  return onChange;
}

describe("WidthEditor", () => {
  it("switches to per-breakpoint, seeding mobile from the uniform value", () => {
    const onChange = renderEditor("half");
    fireEvent.click(screen.getByText("Per breakpoint"));
    expect(onChange).toHaveBeenCalledWith({ mobile: "half" });
  });

  it("toggles to per-breakpoint even from the default (unset) width", () => {
    const onChange = renderEditor(undefined);
    fireEvent.click(screen.getByText("Per breakpoint"));
    expect(onChange).toHaveBeenCalledWith({});
  });

  it("collapses per-breakpoint back to the mobile value when going uniform", () => {
    const onChange = renderEditor({ mobile: "third", desktop: "half" });
    fireEvent.click(screen.getByText("Uniform"));
    expect(onChange).toHaveBeenCalledWith("third");
  });

  it("shows three breakpoint selects in per-breakpoint mode", () => {
    renderEditor({ mobile: "full" });
    expect(screen.getByLabelText("Mobile")).toBeTruthy();
    expect(screen.getByLabelText("Tablet")).toBeTruthy();
    expect(screen.getByLabelText("Desktop")).toBeTruthy();
  });
});
