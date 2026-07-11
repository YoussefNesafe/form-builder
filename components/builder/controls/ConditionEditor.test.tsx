// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ConditionSpec } from "@/form-builder";
import { ConditionEditor } from "./ConditionEditor";
import type { ControlContext } from "./types";
import type { BuilderNode } from "../model/types";

afterEach(cleanup);

// Radix Select needs these to open/pick in jsdom.
window.HTMLElement.prototype.scrollIntoView = () => {};
window.HTMLElement.prototype.hasPointerCapture = () => false;
window.HTMLElement.prototype.releasePointerCapture = () => {};

const descriptor = { key: "visibleWhen", label: "Visible when", control: "condition" as const };
const validityDescriptor = {
  key: "enabledWhen",
  label: "Enabled when",
  control: "condition" as const,
  validityOps: true,
};

function makeCtx(isNested = false): ControlContext {
  const self: BuilderNode = { _id: "self", type: "text", props: { name: "self" } };
  const sibling: BuilderNode = { _id: "s1", type: "select", props: { name: "color" } };
  return { node: self, siblings: [sibling, self], isNested };
}

function renderEditor(
  value: ConditionSpec | undefined,
  d: typeof descriptor | typeof validityDescriptor = descriptor,
  ctx: ControlContext = makeCtx(),
) {
  const onChange = vi.fn();
  render(<ConditionEditor id="c" value={value} onChange={onChange} descriptor={d} ctx={ctx} />);
  return onChange;
}

describe("ConditionEditor", () => {
  it("seeds a condition from the first eligible sibling on add", () => {
    const onChange = renderEditor(undefined);
    fireEvent.click(screen.getByText(/add condition/i));
    expect(onChange).toHaveBeenCalledWith({ field: "color", equals: "" });
  });

  it("coerces the value input for the equals operator", () => {
    const onChange = renderEditor({ field: "color", equals: "" });
    fireEvent.change(screen.getByLabelText("Condition value"), { target: { value: "true" } });
    expect(onChange).toHaveBeenCalledWith({ field: "color", equals: true });
  });

  it("clears the condition", () => {
    const onChange = renderEditor({ field: "color", equals: "red" });
    fireEvent.click(screen.getByLabelText("Remove condition"));
    expect(onChange).toHaveBeenCalledWith(undefined);
  });

  it("disables add when there are no eligible siblings", () => {
    const onChange = vi.fn();
    const self: BuilderNode = { _id: "self", type: "text", props: { name: "self" } };
    render(
      <ConditionEditor
        id="c"
        value={undefined}
        onChange={onChange}
        descriptor={descriptor}
        ctx={{ node: self, siblings: [self], isNested: false }}
      />,
    );
    expect((screen.getByText(/no sibling fields/i) as HTMLButtonElement).disabled).toBe(true);
  });

  it("adding an AND row emits an array spec", () => {
    const onChange = renderEditor({ field: "color", equals: "red" });
    fireEvent.click(screen.getByLabelText("Add AND condition"));
    expect(onChange).toHaveBeenCalledWith([
      { field: "color", equals: "red" },
      { field: "color", equals: "" },
    ]);
  });

  it("adding an OR group emits an anyOf spec", () => {
    const onChange = renderEditor([{ field: "color", equals: "red" }, { field: "color", equals: "blue" }]);
    fireEvent.click(screen.getByLabelText("Add OR group"));
    expect(onChange).toHaveBeenCalledWith({
      anyOf: [
        [
          { field: "color", equals: "red" },
          { field: "color", equals: "blue" },
        ],
        [{ field: "color", equals: "" }],
      ],
    });
  });

  it("removing a row collapses back to the minimal shape", () => {
    const onChange = renderEditor([{ field: "color", equals: "red" }, { field: "color", equals: "blue" }]);
    fireEvent.click(screen.getAllByLabelText("Remove condition")[1]);
    expect(onChange).toHaveBeenCalledWith({ field: "color", equals: "red" });
  });

  it("removing an emptied group drops it entirely", () => {
    const onChange = renderEditor({
      anyOf: [[{ field: "color", equals: "red" }], [{ field: "color", equals: "blue" }]],
    });
    fireEvent.click(screen.getAllByLabelText("Remove condition")[0]);
    expect(onChange).toHaveBeenCalledWith({ field: "color", equals: "blue" });
  });

  it("offers validity operators only when the descriptor allows them", () => {
    renderEditor({ field: "color", equals: "red" }, validityDescriptor);
    fireEvent.click(screen.getByLabelText("Condition operator"));
    expect(screen.getByText("is valid")).toBeTruthy();
    cleanup();
    renderEditor({ field: "color", equals: "red" }, descriptor);
    fireEvent.click(screen.getByLabelText("Condition operator"));
    expect(screen.queryByText("is valid")).toBeNull();
  });

  it("hides validity operators for nested (group) fields", () => {
    renderEditor({ field: "color", equals: "red" }, validityDescriptor, makeCtx(true));
    fireEvent.click(screen.getByLabelText("Condition operator"));
    expect(screen.queryByText("is valid")).toBeNull();
  });

  it("switching to the is valid operator emits an isValid condition without a value input", () => {
    const onChange = renderEditor({ field: "color", equals: "red" }, validityDescriptor);
    fireEvent.click(screen.getByLabelText("Condition operator"));
    fireEvent.click(screen.getByText("is valid"));
    expect(onChange).toHaveBeenCalledWith({ field: "color", isValid: true });
    cleanup();
    renderEditor({ field: "color", isValid: true }, validityDescriptor);
    expect(screen.queryByLabelText("Condition value")).toBeNull();
  });

  it("renders an isValid row with the is invalid operator", () => {
    const onChange = renderEditor({ field: "color", isValid: false }, validityDescriptor);
    const operator = screen.getByLabelText("Condition operator");
    expect(within(operator).getByText("is invalid")).toBeTruthy();
    fireEvent.click(operator);
    fireEvent.click(screen.getByText("is valid"));
    expect(onChange).toHaveBeenCalledWith({ field: "color", isValid: true });
  });
});
