// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Condition } from "@/form-builder";
import { ConditionEditor } from "./ConditionEditor";
import type { ControlContext } from "./types";
import type { BuilderNode } from "../model/types";

afterEach(cleanup);

const descriptor = { key: "visibleWhen", label: "Visible when", control: "condition" as const };

function makeCtx(): ControlContext {
  const self: BuilderNode = { _id: "self", type: "text", props: { name: "self" } };
  const sibling: BuilderNode = { _id: "s1", type: "select", props: { name: "color" } };
  return { node: self, siblings: [sibling, self], isNested: false };
}

function renderEditor(value: Condition | undefined) {
  const onChange = vi.fn();
  render(<ConditionEditor id="c" value={value} onChange={onChange} descriptor={descriptor} ctx={makeCtx()} />);
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
});
