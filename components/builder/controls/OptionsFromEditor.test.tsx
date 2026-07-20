// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OptionsFromEditor } from "./OptionsFromEditor";
import type { ControlContext } from "./types";
import type { BuilderNode } from "../model/types";

afterEach(cleanup);

const descriptor = { key: "optionsFrom", label: "Options from field", control: "optionsFrom" as const };

function makeCtx(): ControlContext {
  const self: BuilderNode = { _id: "self", type: "select", props: { name: "city" } };
  const source: BuilderNode = {
    _id: "s1",
    type: "select",
    props: {
      name: "country",
      options: [
        { label: "US", value: "US" },
        { label: "AE", value: "AE" },
      ],
    },
  };
  return { node: self, siblings: [source, self], isNested: false };
}

describe("OptionsFromEditor", () => {
  it("seeds one branch per static source option value", () => {
    const onChange = vi.fn();
    render(
      <OptionsFromEditor id="o" value={undefined} onChange={onChange} descriptor={descriptor} ctx={makeCtx()} />,
    );
    fireEvent.click(screen.getByText(/add options mapping/i));
    expect(onChange).toHaveBeenCalledWith({ field: "country", map: { US: [], AE: [] } });
  });

  it("a transient rename collision never destroys the older branch (first key wins)", () => {
    const onChange = vi.fn();
    const optionsA = [{ label: "Old", value: "old" }];
    const optionsAB = [{ label: "New", value: "new" }];
    render(
      <OptionsFromEditor
        id="o"
        value={{ field: "country", map: { a: optionsA, ab: optionsAB } }}
        onChange={onChange}
        descriptor={descriptor}
        ctx={makeCtx()}
      />,
    );
    const secondKey = screen.getByLabelText("Branch 2 source value");
    fireEvent.change(secondKey, { target: { value: "a" } });
    expect(onChange).toHaveBeenLastCalledWith({ field: "country", map: { a: optionsA } });
    expect(screen.getByText(/duplicate source value/i)).toBeTruthy();
    fireEvent.change(secondKey, { target: { value: "ac" } });
    expect(onChange).toHaveBeenLastCalledWith({ field: "country", map: { a: optionsA, ac: optionsAB } });
    expect(screen.queryByText(/duplicate source value/i)).toBeNull();
  });

  it("consecutive new branches do not collapse into each other", () => {
    const onChange = vi.fn();
    render(
      <OptionsFromEditor
        id="o"
        value={{ field: "country", map: {} }}
        onChange={onChange}
        descriptor={descriptor}
        ctx={makeCtx()}
      />,
    );
    fireEvent.click(screen.getByLabelText("Add value branch"));
    fireEvent.click(screen.getByLabelText("Add value branch"));
    expect(screen.getByLabelText("Branch 1 source value")).toBeTruthy();
    expect(screen.getByLabelText("Branch 2 source value")).toBeTruthy();
  });
});
