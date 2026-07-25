import { describe, it, expectTypeOf } from "vitest";
import type { ComponentProps } from "react";
import { defineForm } from "../core/defineForm";
import type { InferValues } from "../core/inferValues";
import { FormRenderer } from "./FormRenderer";

describe("FormRenderer onSubmit typing", () => {
  it("infers the submit payload from config", () => {
    const cfg = defineForm({ id: "f", fields: [{ name: "email", type: "email", required: true }] });
    type OnSubmit = ComponentProps<typeof FormRenderer<typeof cfg>>["onSubmit"];
    type Payload = OnSubmit extends (v: infer V) => unknown ? V : never;
    expectTypeOf<Payload>().toEqualTypeOf<InferValues<typeof cfg>>();
  });
});
