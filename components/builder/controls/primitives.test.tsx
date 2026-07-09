// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { JsonControl, NumberControl } from "./primitives";
import type { ControlContext, ControlProps } from "./types";

afterEach(cleanup);

const ctx = {} as ControlContext;

describe("JsonControl", () => {
  it("clears to an empty string (not undefined) so a hidden value keeps its key", () => {
    const onChange = vi.fn();
    render(
      <JsonControl
        id="v"
        value="hi"
        onChange={onChange}
        descriptor={{ key: "value", label: "Value", control: "json" }}
        ctx={ctx}
      />,
    );
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "" } });
    expect(onChange).toHaveBeenCalledWith("");
  });

  it("parses JSON, falling back to a raw string", () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <JsonControl id="v" value={undefined} onChange={onChange} descriptor={{ key: "value", label: "Value", control: "json" }} ctx={ctx} />,
    );
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "42" } });
    expect(onChange).toHaveBeenCalledWith(42);
    rerender(
      <JsonControl id="v" value={undefined} onChange={onChange} descriptor={{ key: "value", label: "Value", control: "json" }} ctx={ctx} />,
    );
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "not json" } });
    expect(onChange).toHaveBeenCalledWith("not json");
  });
});

describe("NumberControl", () => {
  it("truncates to an integer when the descriptor says integer", () => {
    const onChange = vi.fn();
    const props: ControlProps<number> = {
      id: "n",
      value: undefined,
      onChange,
      descriptor: { key: "length", label: "Length", control: "number", integer: true, min: 1 },
      ctx,
    };
    render(<NumberControl {...props} />);
    fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "3.9" } });
    expect(onChange).toHaveBeenCalledWith(3);
  });
});
