// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
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

    expect(screen.getByText("Your email")).toBeTruthy();
    expect(screen.getByText(/Email · /)).toBeTruthy();
    expect(screen.getByText(/Select · /)).toBeTruthy();
    expect(screen.getByText("2")).toBeTruthy();
  });

  it("deletes a node via its row action button (mouse)", () => {
    const store = useBuilderStore.getState();
    store.addNode("text");
    render(<FieldList />);
    fireEvent.click(screen.getByLabelText("Delete"));
    expect(useBuilderStore.getState().nodes).toHaveLength(0);
  });

  it("does not select the row when a keyboard event targets a nested action button", () => {
    const store = useBuilderStore.getState();
    store.addNode("text");
    store.selectNode(null);
    render(<FieldList />);
    fireEvent.keyDown(screen.getByLabelText("Delete"), { key: "Enter" });
    expect(useBuilderStore.getState().selectedId).toBeNull();
  });

  it("renders group children indented under the group", () => {
    const store = useBuilderStore.getState();
    store.addNode("group");
    const groupId = useBuilderStore.getState().nodes[0]._id;
    store.addNode("email", groupId);

    render(<FieldList />);
    expect(screen.getByText(/Group \(repeatable\) · /)).toBeTruthy();
    expect(screen.getAllByText(/· /).length).toBeGreaterThanOrEqual(3);
  });
});
