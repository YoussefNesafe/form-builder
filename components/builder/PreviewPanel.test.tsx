// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { registerBuiltInFields } from "@/form-builder";
import { PreviewPanel } from "./PreviewPanel";
import { useBuilderStore } from "./model/store";
import { resetIds } from "./model/ids";

beforeAll(() => registerBuiltInFields());
beforeEach(() => {
  resetIds();
  useBuilderStore.getState().reset();
});
afterEach(cleanup);

describe("PreviewPanel", () => {
  it("shows an empty state with no fields", () => {
    render(<PreviewPanel />);
    expect(screen.getByText(/add a field/i)).toBeTruthy();
  });

  it("renders the real form for a valid config", () => {
    const store = useBuilderStore.getState();
    store.addNode("text");
    store.updateProps(useBuilderStore.getState().nodes[0]._id, { name: "email", label: "Your email" });
    render(<PreviewPanel />);
    expect(screen.getByText("Your email")).toBeTruthy();
  });

  it("shows an issues panel instead of crashing for an invalid config", () => {
    const store = useBuilderStore.getState();
    store.addNode("text");
    store.addNode("text");
    // Force a duplicate name — validateFormConfig rejects it.
    const ids = useBuilderStore.getState().nodes.map((x) => x._id);
    store.updateProps(ids[0], { name: "dup" });
    store.updateProps(ids[1], { name: "dup" });

    render(<PreviewPanel />);
    expect(screen.getByText(/config not valid yet/i)).toBeTruthy();
    expect(screen.getByText(/duplicate field name/i)).toBeTruthy();
  });
});
