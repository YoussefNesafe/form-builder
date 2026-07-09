// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { FieldList } from "./FieldList";
import { useBuilderStore } from "./model/store";
import { resetIds } from "./model/ids";

beforeEach(() => {
  resetIds();
  useBuilderStore.getState().reset();
});
afterEach(cleanup);

describe("FieldList", () => {
  it("shows an empty state when there are no fields", () => {
    render(<FieldList />);
    expect(screen.getByText(/no fields yet/i)).toBeTruthy();
  });

  it("renders a row per top-level node with its label and type", () => {
    const store = useBuilderStore.getState();
    store.addNode("email");
    store.updateProps(useBuilderStore.getState().nodes[0]._id, { label: "Your email" });
    store.addNode("select");

    render(<FieldList />);

    expect(screen.getByText("Your email")).toBeTruthy(); // label line
    expect(screen.getByText(/Email · /)).toBeTruthy(); // type · name line
    expect(screen.getByText(/Select · /)).toBeTruthy();
    // count badge reflects two fields
    expect(screen.getByText("2")).toBeTruthy();
  });

  it("renders group children indented under the group", () => {
    const store = useBuilderStore.getState();
    store.addNode("group"); // creates a default text child
    const groupId = useBuilderStore.getState().nodes[0]._id;
    store.addNode("email", groupId);

    render(<FieldList />);
    // default child (text) + added email → the group row plus two children render
    expect(screen.getByText(/Group \(repeatable\) · /)).toBeTruthy();
    expect(screen.getAllByText(/· /).length).toBeGreaterThanOrEqual(3);
  });
});
