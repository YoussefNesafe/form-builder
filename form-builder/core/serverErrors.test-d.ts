import { describe, it, expectTypeOf } from "vitest";
import type { ServerErrorResult } from "./serverErrors";
import type { FieldNames } from "./inferValues";
import { defineForm } from "./defineForm";

describe("ServerErrorResult field keys", () => {
  it("constrains fieldErrors keys to real field names", () => {
    const cfg = defineForm({ id: "f", fields: [{ name: "email", type: "email" }] });
    type Keys = keyof NonNullable<ServerErrorResult<FieldNames<typeof cfg>>["fieldErrors"]>;
    expectTypeOf<Keys>().toEqualTypeOf<"email">();
  });
});
