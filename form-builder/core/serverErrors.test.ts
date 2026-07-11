import { describe, expect, it, vi } from "vitest";
import { applyServerErrors } from "./serverErrors";
import type { AnyFieldConfig } from "./types";

const fields: AnyFieldConfig[] = [
  { type: "text", name: "firstName" },
  { type: "email", name: "email" },
  { type: "group", name: "team", fields: [{ type: "text", name: "role" }] },
];

describe("applyServerErrors", () => {
  it("sets a server-typed error per known field, in config order", () => {
    const setError = vi.fn();
    const outcome = applyServerErrors(
      setError,
      { fieldErrors: { email: "Email already registered", firstName: "Too short" } },
      fields,
    );
    expect(setError).toHaveBeenCalledWith("email", { type: "server", message: "Email already registered" });
    expect(setError).toHaveBeenCalledWith("firstName", { type: "server", message: "Too short" });
    expect(outcome.applied).toEqual(["firstName", "email"]);
    expect(outcome.formError).toBeUndefined();
  });

  it("resolves group row paths by their root field", () => {
    const setError = vi.fn();
    const outcome = applyServerErrors(setError, { fieldErrors: { "team.0.role": "Unknown role" } }, fields);
    expect(setError).toHaveBeenCalledWith("team.0.role", { type: "server", message: "Unknown role" });
    expect(outcome.applied).toEqual(["team.0.role"]);
  });

  it("folds dotted paths under non-group roots into formError (invisible otherwise)", () => {
    const setError = vi.fn();
    const outcome = applyServerErrors(setError, { fieldErrors: { "email.whatever": "Nested" } }, fields);
    expect(setError).not.toHaveBeenCalled();
    expect(outcome.formError).toBe("Nested");
  });

  it("folds unknown field names into formError alongside the explicit one", () => {
    const setError = vi.fn();
    const outcome = applyServerErrors(
      setError,
      { fieldErrors: { ghost: "No such field" }, formError: "Something went wrong" },
      fields,
    );
    expect(setError).not.toHaveBeenCalled();
    expect(outcome.applied).toEqual([]);
    expect(outcome.formError).toBe("Something went wrong; No such field");
  });

  it("returns nothing for an empty result", () => {
    const outcome = applyServerErrors(vi.fn(), {}, fields);
    expect(outcome.applied).toEqual([]);
    expect(outcome.formError).toBeUndefined();
  });
});
