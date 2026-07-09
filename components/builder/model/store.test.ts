import { describe, it, expect, beforeEach } from "vitest";
import { createBuilderStore } from "./store";
import { resetIds } from "./ids";
import { serialize } from "./serialize";

beforeEach(() => resetIds());

describe("builder store", () => {
  it("adds a node with default props, a unique name, and selects it", () => {
    const s = createBuilderStore();
    s.getState().addNode("otp");
    const { nodes, selectedId } = s.getState();
    expect(nodes).toHaveLength(1);
    expect(nodes[0].type).toBe("otp");
    expect(nodes[0].props.length).toBe(6);
    expect(typeof nodes[0].props.name).toBe("string");
    expect(nodes[0].props.name).not.toBe("");
    expect(selectedId).toBe(nodes[0]._id);
  });

  it("keeps generated names unique across adds", () => {
    const s = createBuilderStore();
    s.getState().addNode("text");
    s.getState().addNode("text");
    const names = s.getState().nodes.map((n) => n.props.name);
    expect(new Set(names).size).toBe(2);
  });

  it("merges prop patches", () => {
    const s = createBuilderStore();
    s.getState().addNode("text");
    const id = s.getState().nodes[0]._id;
    s.getState().updateProps(id, { label: "Email", required: true });
    expect(s.getState().nodes[0].props).toMatchObject({ label: "Email", required: true });
  });

  it("moves a node within the top level", () => {
    const s = createBuilderStore();
    s.getState().addNode("text"); // n1
    s.getState().addNode("email"); // n2
    const first = s.getState().nodes[0]._id;
    s.getState().moveNode(first, 1);
    expect(s.getState().nodes.map((n) => n.type)).toEqual(["email", "text"]);
  });

  it("duplicates a node with a fresh id and a unique name", () => {
    const s = createBuilderStore();
    s.getState().addNode("text");
    const id = s.getState().nodes[0]._id;
    s.getState().updateProps(id, { label: "Original" });
    s.getState().duplicateNode(id);
    const { nodes } = s.getState();
    expect(nodes).toHaveLength(2);
    expect(nodes[1]._id).not.toBe(nodes[0]._id);
    expect(nodes[1].props.label).toBe("Original");
    expect(nodes[1].props.name).not.toBe(nodes[0].props.name);
  });

  it("removes a node, clears selection, and drops it from steps", () => {
    const s = createBuilderStore();
    s.getState().addNode("text");
    const id = s.getState().nodes[0]._id;
    s.setState({ multiStep: true, steps: [{ title: "One", nodeIds: [id] }] });
    s.getState().removeNode(id);
    expect(s.getState().nodes).toHaveLength(0);
    expect(s.getState().selectedId).toBeNull();
    expect(s.getState().steps[0].nodeIds).toEqual([]);
  });

  it("adds a child into a group and creates a default child on group add", () => {
    const s = createBuilderStore();
    s.getState().addNode("group");
    const group = s.getState().nodes[0];
    expect(group.children).toHaveLength(1); // default child
    s.getState().addNode("email", group._id);
    expect(s.getState().nodes[0].children).toHaveLength(2);
  });

  it("round-trips through the serializer", () => {
    const s = createBuilderStore();
    s.getState().addNode("text");
    s.getState().updateProps(s.getState().nodes[0]._id, { name: "email", label: "Email" });
    const config = serialize(s.getState());
    expect(config.fields[0]).toEqual({ type: "text", name: "email", label: "Email" });
  });

  it("reset clears everything to defaults", () => {
    const s = createBuilderStore();
    s.getState().addNode("text");
    s.getState().reset();
    expect(s.getState().nodes).toHaveLength(0);
    expect(s.getState().selectedId).toBeNull();
    expect(s.getState().multiStep).toBe(false);
  });
});
