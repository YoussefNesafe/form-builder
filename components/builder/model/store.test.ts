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

  it("moves, duplicates, and removes a node nested inside a group", () => {
    const s = createBuilderStore();
    s.getState().addNode("group");
    const group = s.getState().nodes[0]._id;
    s.getState().addNode("email", group); // group now has [text(default), email]
    const kids = () => s.getState().nodes[0].children!;
    const firstChild = kids()[0]._id;

    s.getState().moveNode(firstChild, 1);
    expect(kids().map((n) => n.type)).toEqual(["email", "text"]);

    s.getState().duplicateNode(kids()[0]._id);
    expect(kids()).toHaveLength(3);
    // duplicated child name stays unique across the whole tree
    const allNames = kids().map((n) => n.props.name);
    expect(new Set(allNames).size).toBe(allNames.length);

    const removeId = kids()[0]._id;
    s.getState().removeNode(removeId);
    expect(kids().some((n) => n._id === removeId)).toBe(false);
  });

  it("scrubs sibling references when a referenced field is deleted", () => {
    const s = createBuilderStore();
    s.getState().addNode("email");
    const emailId = s.getState().nodes[0]._id;
    s.getState().updateProps(emailId, { name: "email" });
    s.getState().addNode("otp");
    const otpId = s.getState().nodes[1]._id;
    s.getState().updateProps(otpId, { dependsOn: "email" });
    s.getState().addNode("text");
    const textId = s.getState().nodes[2]._id;
    s.getState().updateProps(textId, { visibleWhen: { field: "email", equals: "x" } });

    s.getState().removeNode(emailId);

    const otp = s.getState().nodes.find((n) => n._id === otpId)!;
    const text = s.getState().nodes.find((n) => n._id === textId)!;
    expect(otp.props.dependsOn).toBeUndefined();
    expect(text.props.visibleWhen).toBeUndefined();
  });

  it("round-trips through the serializer", () => {
    const s = createBuilderStore();
    s.getState().addNode("text");
    s.getState().updateProps(s.getState().nodes[0]._id, { name: "email", label: "Email" });
    const config = serialize(s.getState());
    expect(config.fields[0]).toEqual({ type: "text", name: "email", label: "Email" });
  });

  it("seeds a first step from eligible fields when multiStep turns on", () => {
    const s = createBuilderStore();
    s.getState().addNode("text");
    s.getState().addNode("submit"); // ineligible — must not be assigned
    s.getState().toggleMultiStep(true);
    const { steps, nodes } = s.getState();
    expect(steps).toHaveLength(1);
    expect(steps[0].nodeIds).toEqual([nodes[0]._id]); // text only, not submit
  });

  it("assigns a node to exactly one step", () => {
    const s = createBuilderStore();
    s.getState().addNode("text");
    const id = s.getState().nodes[0]._id;
    s.setState({ multiStep: true, steps: [{ title: "A", nodeIds: [id] }, { title: "B", nodeIds: [] }] });
    s.getState().assignNodeToStep(id, 1);
    expect(s.getState().steps[0].nodeIds).toEqual([]);
    expect(s.getState().steps[1].nodeIds).toEqual([id]);
    s.getState().assignNodeToStep(id, null); // unassign
    expect(s.getState().steps.every((st) => !st.nodeIds.includes(id))).toBe(true);
  });

  it("adds, renames, reorders, and removes steps", () => {
    const s = createBuilderStore();
    s.getState().addStep();
    s.getState().addStep();
    expect(s.getState().steps).toHaveLength(2);
    s.getState().renameStep(0, "Intro");
    expect(s.getState().steps[0].title).toBe("Intro");
    s.getState().moveStep(0, 1);
    expect(s.getState().steps[1].title).toBe("Intro");
    s.getState().removeStep(0);
    expect(s.getState().steps).toHaveLength(1);
    expect(s.getState().steps[0].title).toBe("Intro");
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
