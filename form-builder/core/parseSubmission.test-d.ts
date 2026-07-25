import { describe, it, expectTypeOf } from "vitest";
import { defineForm } from "./defineForm";
import { parseSubmission } from "./parseSubmission";
import type { InferValues } from "./inferValues";

describe("parseSubmission typing", () => {
  it("returns typed values on success", () => {
    const cfg = defineForm({ id: "f", fields: [{ name: "email", type: "email", required: true }] });
    const result = parseSubmission(cfg, {}, {});
    if (result.ok) {
      expectTypeOf(result.values).toEqualTypeOf<InferValues<typeof cfg>>();
    }
  });
});
