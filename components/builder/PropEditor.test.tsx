// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { PropEditorPanel } from "./PropEditor";
import { useBuilderStore } from "./model/store";
import { resetIds } from "./model/ids";

beforeEach(() => {
  resetIds();
  useBuilderStore.getState().reset();
});
afterEach(cleanup);

describe("PropEditorPanel", () => {
  it("prompts to select a field when nothing is selected", () => {
    render(<PropEditorPanel />);
    expect(screen.getByText(/select a field/i)).toBeTruthy();
  });

  it("edits the label prop of the selected field through the store", () => {
    const store = useBuilderStore.getState();
    store.addNode("text");
    const id = useBuilderStore.getState().nodes[0]._id;
    store.selectNode(id);

    render(<PropEditorPanel />);
    fireEvent.change(screen.getByLabelText("Label"), { target: { value: "Email address" } });

    expect(useBuilderStore.getState().nodes[0].props.label).toBe("Email address");
  });

  it("hides group-forbidden wiring props for a node nested in a group", () => {
    const store = useBuilderStore.getState();
    store.addNode("group");
    const groupId = useBuilderStore.getState().nodes[0]._id;
    store.addNode("otp", groupId);
    const otpChild = useBuilderStore.getState().nodes[0].children!.at(-1)!;
    store.selectNode(otpChild._id);

    render(<PropEditorPanel />);
    expect(screen.getByLabelText("Length")).toBeTruthy();
    expect(screen.queryByText("Depends on")).toBeNull();
    expect(screen.queryByText("Enabled when verified")).toBeNull();
  });

  it("shows dependsOn for a top-level otp field", () => {
    const store = useBuilderStore.getState();
    store.addNode("otp");
    store.selectNode(useBuilderStore.getState().nodes[0]._id);

    render(<PropEditorPanel />);
    expect(screen.getByText("Depends on")).toBeTruthy();
  });
});
