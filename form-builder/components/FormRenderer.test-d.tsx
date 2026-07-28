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

describe("FormRenderer step-control prop typing", () => {
  it("onDraftRestore receives an info object carrying an optional step", () => {
    type OnDraftRestore = NonNullable<ComponentProps<typeof FormRenderer>["onDraftRestore"]>;
    expectTypeOf<Parameters<OnDraftRestore>[0]>().toEqualTypeOf<{ step?: number }>();
  });

  it("step and onStepChange are plain, non-generic step indices", () => {
    type Props = ComponentProps<typeof FormRenderer>;
    expectTypeOf<Props["step"]>().toEqualTypeOf<number | undefined>();
    expectTypeOf<NonNullable<Props["onStepChange"]>>().toEqualTypeOf<(step: number) => void>();
  });

  it("stepperOrientation is closed to the two supported layouts", () => {
    type Orientation = ComponentProps<typeof FormRenderer>["stepperOrientation"];
    expectTypeOf<Orientation>().toEqualTypeOf<"horizontal" | "vertical" | undefined>();
  });
});
