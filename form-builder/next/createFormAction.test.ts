import { describe, expect, expectTypeOf, it } from "vitest";
import { defineForm } from "../core/defineForm";
import type { InferValues } from "../core/inferValues";
import { createFormAction } from "./createFormAction";

const cfg = defineForm({ id: "f", fields: [{ name: "email", type: "email", required: true }] });

describe("createFormAction", () => {
  it("passes typed data to the handler on valid input", async () => {
    const action = createFormAction(cfg, async (data) => {
      expectTypeOf(data).toEqualTypeOf<InferValues<typeof cfg>>();
      return { ok: true as const };
    });
    const res = await action({ email: "a@b.com" });
    expect(res.ok).toBe(true);
  });

  it("short-circuits to field errors on invalid input", async () => {
    const action = createFormAction(cfg, async () => ({ ok: true as const }));
    const res = await action({ email: "" });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.errors.fieldErrors?.email).toBeTruthy();
  });

  it("funnels a handler-thrown field error into ServerErrorResult", async () => {
    const action = createFormAction(cfg, async () => {
      throw { fieldErrors: { email: "taken" } };
    });
    const res = await action({ email: "a@b.com" });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.errors.fieldErrors?.email).toBe("taken");
  });

  it("re-throws a genuine error instead of swallowing it", async () => {
    const action = createFormAction(cfg, async () => {
      throw new Error("database is down");
    });
    await expect(action({ email: "a@b.com" })).rejects.toThrow("database is down");
  });

  it("re-throws a non-field-error object (no fieldErrors/formError keys)", async () => {
    const action = createFormAction(cfg, async () => {
      throw { code: "AUTH_FAILED" };
    });
    await expect(action({ email: "a@b.com" })).rejects.toMatchObject({ code: "AUTH_FAILED" });
  });
});
