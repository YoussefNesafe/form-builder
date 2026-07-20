import { describe, it, expect } from "vitest";
import { validateFormConfig } from "@/form-builder";
import { serialize, slugify } from "./serialize";
import type { BuilderNode, BuilderState } from "./types";

function baseState(over: Partial<BuilderState>): BuilderState {
  return {
    title: "My Form",
    description: "",
    nodes: [],
    multiStep: false,
    steps: [],
    selectedId: null,
    outputMode: "ts",
    ...over,
  };
}

const textNode = (id: string, name: string, extra: Record<string, unknown> = {}): BuilderNode => ({
  _id: id,
  type: "text",
  props: { name, label: name, ...extra },
});

describe("slugify", () => {
  it("lowercases, hyphenates, strips punctuation", () => {
    expect(slugify("My Cool Form!")).toBe("my-cool-form");
    expect(slugify("  Multiple   Spaces  ")).toBe("multiple-spaces");
    expect(slugify("")).toBe("");
  });
});

describe("serialize", () => {
  it("emits id from the title, fields from nodes", () => {
    const config = serialize(baseState({ nodes: [textNode("n1", "email")] }));
    expect(config.id).toBe("my-form");
    expect(config.title).toBe("My Form");
    expect(config.fields).toEqual([{ type: "text", name: "email", label: "email" }]);
  });

  it("falls back to untitled-form when title is blank", () => {
    expect(serialize(baseState({ title: "" })).id).toBe("untitled-form");
  });

  it("drops undefined, empty-string, and false props (but keeps hidden value)", () => {
    const config = serialize(
      baseState({
        nodes: [
          textNode("n1", "a", { placeholder: "", required: false, description: undefined }),
          { _id: "n2", type: "hidden", props: { name: "h", value: "" } },
        ],
      }),
    );
    expect(config.fields[0]).toEqual({ type: "text", name: "a", label: "a" });
    expect(config.fields[1]).toEqual({ type: "hidden", name: "h", value: "" });
  });

  it("recurses group children into fields", () => {
    const config = serialize(
      baseState({
        nodes: [
          {
            _id: "g1",
            type: "group",
            props: { name: "team", min: 1 },
            children: [textNode("c1", "member")],
          },
        ],
      }),
    );
    expect(config.fields[0]).toEqual({
      type: "group",
      name: "team",
      min: 1,
      fields: [{ type: "text", name: "member", label: "member" }],
    });
  });

  it("maps step nodeIds to fieldNames, skipping missing ids", () => {
    const config = serialize(
      baseState({
        nodes: [textNode("n1", "a"), textNode("n2", "b")],
        multiStep: true,
        steps: [{ title: "One", nodeIds: ["n1", "gone", "n2"] }],
      }),
    );
    expect(config.steps).toEqual([{ title: "One", fieldNames: ["a", "b"] }]);
  });

  it("omits steps entirely when multiStep is off", () => {
    const config = serialize(
      baseState({ nodes: [textNode("n1", "a")], multiStep: false, steps: [{ title: "One", nodeIds: ["n1"] }] }),
    );
    expect(config.steps).toBeUndefined();
  });

  it("keeps a hidden value of false (not pruned as a falsy prop)", () => {
    const config = serialize(baseState({ nodes: [{ _id: "n1", type: "hidden", props: { name: "flag", value: false } }] }));
    expect(config.fields[0]).toEqual({ type: "hidden", name: "flag", value: false });
  });

  it("drops a step whose fields were all removed (empty fieldNames is invalid)", () => {
    const config = serialize(
      baseState({
        nodes: [textNode("n1", "a")],
        multiStep: true,
        steps: [
          { title: "Kept", nodeIds: ["n1"] },
          { title: "Emptied", nodeIds: ["gone"] },
        ],
      }),
    );
    expect(config.steps).toEqual([{ title: "Kept", fieldNames: ["a"] }]);
  });

  it("produces a config that passes validateFormConfig", () => {
    const config = serialize(
      baseState({
        nodes: [
          textNode("n1", "email", { required: true }),
          { _id: "n2", type: "submit", props: { name: "go", text: "Submit" } },
        ],
      }),
    );
    expect(() => validateFormConfig(config)).not.toThrow();
  });

  it("keeps numeric 0 (not pruned as a falsy prop, like false/empty-string are)", () => {
    const config = serialize(
      baseState({ nodes: [{ _id: "n1", type: "number", props: { name: "n", min: 0 } }] }),
    );
    expect(config.fields[0]).toEqual({ type: "number", name: "n", min: 0 });
  });

  it("drops a hidden field's value when it is null (the exemption does not cover null)", () => {
    const config = serialize(
      baseState({ nodes: [{ _id: "n1", type: "hidden", props: { name: "h", value: null } }] }),
    );
    expect(config.fields[0]).toEqual({ type: "hidden", name: "h" });
  });
});
