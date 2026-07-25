import { describe, it, expectTypeOf } from "vitest";
import { defineForm } from "./defineForm";
import type { FieldNames, InferValues } from "./inferValues";

describe("InferValues — scalars", () => {
  it("maps string-valued field types to string", () => {
    const cfg = defineForm({
      id: "f",
      fields: [
        { name: "a", type: "text" },
        { name: "b", type: "email", required: true },
        { name: "c", type: "number", required: true },
        { name: "d", type: "rating", required: true },
      ],
    });
    type V = InferValues<typeof cfg>;
    expectTypeOf<V["b"]>().toEqualTypeOf<string>();
    expectTypeOf<V["c"]>().toEqualTypeOf<number>();
    expectTypeOf<V["d"]>().toEqualTypeOf<number>();
  });

  it("maps collection and special shapes", () => {
    const cfg = defineForm({
      id: "f",
      fields: [
        { name: "agree", type: "checkbox", required: true },
        { name: "tags", type: "checkbox", required: true, options: [{ label: "A", value: "a" }] },
        { name: "picks", type: "select", required: true, multiple: true, options: [] },
        { name: "range", type: "date", required: true, range: true },
        { name: "doc", type: "file", required: true, multiple: true },
        { name: "singleDoc", type: "file", required: true },
        {
          name: "rows", type: "group", required: true,
          fields: [{ name: "qty", type: "number", required: true }],
        },
      ],
    });
    type V = InferValues<typeof cfg>;
    expectTypeOf<V["agree"]>().toEqualTypeOf<boolean>();
    expectTypeOf<V["tags"]>().toEqualTypeOf<string[]>();
    expectTypeOf<V["picks"]>().toEqualTypeOf<string[]>();
    expectTypeOf<V["range"]>().toEqualTypeOf<[string, string]>();
    expectTypeOf<V["doc"]>().toEqualTypeOf<File[]>();
    expectTypeOf<V["singleDoc"]>().toEqualTypeOf<File | File[]>();
    expectTypeOf<V["rows"]>().toEqualTypeOf<{ qty: number }[]>();
  });

  it("maps the remaining single-value and escape-hatch shapes", () => {
    const cfg = defineForm({
      id: "f",
      fields: [
        { name: "country", type: "select", required: true, options: [] },
        { name: "born", type: "date", required: true },
        { name: "start", type: "time", required: true },
        { name: "power", type: "switch", required: true },
        { name: "perks", type: "switch", required: true, options: [{ label: "A", value: "a" }] },
        { name: "secret", type: "hidden", value: "abc" },
        { name: "widget", type: "my-custom-widget" },
      ],
    });
    type V = InferValues<typeof cfg>;
    expectTypeOf<V["country"]>().toEqualTypeOf<string>();
    expectTypeOf<V["born"]>().toEqualTypeOf<string>();
    expectTypeOf<V["start"]>().toEqualTypeOf<string>();
    expectTypeOf<V["power"]>().toEqualTypeOf<boolean>();
    expectTypeOf<V["perks"]>().toEqualTypeOf<string[]>();
    expectTypeOf<V["secret"]>().toEqualTypeOf<"abc">();
    expectTypeOf<V["widget"]>().toEqualTypeOf<unknown>();
  });

  it("marks conditionally-visible fields optional", () => {
    const cfg = defineForm({
      id: "f",
      fields: [
        { name: "always", type: "text", required: true },
        { name: "maybe", type: "text", required: true, visibleWhen: { field: "always", equals: "x" } },
      ],
    });
    type V = InferValues<typeof cfg>;
    expectTypeOf<V>().toEqualTypeOf<{ always: string; maybe?: string }>();
  });

  it("exposes the field-name union", () => {
    const cfg = defineForm({
      id: "f",
      fields: [
        { name: "email", type: "email" },
        { name: "age", type: "number" },
        { name: "hr", type: "static", content: "x" },
      ],
    });
    expectTypeOf<FieldNames<typeof cfg>>().toEqualTypeOf<"email" | "age" | "hr">();
  });
});
