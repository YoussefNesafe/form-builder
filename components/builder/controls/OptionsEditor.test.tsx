// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Option } from "@/form-builder";
import { OptionsEditor } from "./OptionsEditor";
import type { ControlContext } from "./types";

afterEach(cleanup);

const ctx = {} as ControlContext;
const descriptor = { key: "options", label: "Options", control: "options" as const };

function renderEditor(value: Option[] | undefined) {
  const onChange = vi.fn();
  render(<OptionsEditor id="opts" value={value} onChange={onChange} descriptor={descriptor} ctx={ctx} />);
  return onChange;
}

describe("OptionsEditor", () => {
  it("adds an option", () => {
    const onChange = renderEditor([{ label: "A", value: "a" }]);
    fireEvent.click(screen.getByText(/add option/i));
    expect(onChange).toHaveBeenCalledWith([
      { label: "A", value: "a" },
      { label: "Option 2", value: "option-2" },
    ]);
  });

  it("edits a label", () => {
    const onChange = renderEditor([{ label: "A", value: "a" }]);
    fireEvent.change(screen.getByLabelText("Option 1 label"), { target: { value: "Red" } });
    expect(onChange).toHaveBeenCalledWith([{ label: "Red", value: "a" }]);
  });

  it("removes the last option and clears the prop (undefined)", () => {
    const onChange = renderEditor([{ label: "A", value: "a" }]);
    fireEvent.click(screen.getByLabelText("Remove option 1"));
    expect(onChange).toHaveBeenCalledWith(undefined);
  });

  it("toggles disabled on an option", () => {
    const onChange = renderEditor([{ label: "A", value: "a" }]);
    fireEvent.click(screen.getByRole("switch"));
    expect(onChange).toHaveBeenCalledWith([{ label: "A", value: "a", disabled: true }]);
  });

  it("reorders options", () => {
    const onChange = renderEditor([
      { label: "A", value: "a" },
      { label: "B", value: "b" },
    ]);
    fireEvent.click(screen.getByLabelText("Move option 1 down"));
    expect(onChange).toHaveBeenCalledWith([
      { label: "B", value: "b" },
      { label: "A", value: "a" },
    ]);
  });
});
