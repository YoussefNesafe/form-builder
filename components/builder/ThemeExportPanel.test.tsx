// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ThemeExportPanel } from "./ThemeExportPanel";

afterEach(cleanup);

const pre = (c: HTMLElement) => c.querySelector("pre")?.textContent ?? "";
const note = (c: HTMLElement) => c.querySelector("#theme-fixed-note")?.textContent ?? "";

describe("ThemeExportPanel", () => {
  it("defaults to vw: fluid, no reference-width inputs", () => {
    const { container } = render(<ThemeExportPanel />);
    expect(pre(container)).toContain("--fb-space-3: 1.602vw;");
    expect(screen.queryAllByRole("spinbutton")).toHaveLength(0);
    expect(note(container)).toMatch(/fluid/i);
  });

  it("switching to px reveals 3 reference inputs and emits fixed px", () => {
    const { container } = render(<ThemeExportPanel />);
    fireEvent.click(screen.getByRole("radio", { name: "px" }));
    expect(screen.getAllByRole("spinbutton")).toHaveLength(3);
    expect(pre(container)).toContain("--fb-space-8-desktop: 16px;");
    expect(note(container)).toMatch(/fixed/i);
  });

  it("rem adds the base input and divides by it", () => {
    const { container } = render(<ThemeExportPanel />);
    fireEvent.click(screen.getByRole("radio", { name: "rem" }));
    expect(screen.getAllByRole("spinbutton")).toHaveLength(4);
    expect(pre(container)).toContain("--fb-space-8-desktop: 1rem;");
  });

  it("clearing a reference input falls back to its default", () => {
    const { container } = render(<ThemeExportPanel />);
    fireEvent.click(screen.getByRole("radio", { name: "px" }));
    fireEvent.change(screen.getByLabelText(/desktop/i), { target: { value: "" } });
    expect(pre(container)).toContain("--fb-space-8-desktop: 16px;");
  });
});
