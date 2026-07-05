import { describe, expect, it } from "vitest";
import { withNamePrefix } from "./GroupField";
import type { FieldConfig } from "../core/types";

describe("withNamePrefix", () => {
  it("prefixes name", () => {
    const field: FieldConfig = { type: "text", name: "member" };
    expect(withNamePrefix(field, "team.0").name).toBe("team.0.member");
  });

  it("prefixes condition field paths (row scoping)", () => {
    const field: FieldConfig = {
      type: "text",
      name: "role",
      visibleWhen: { field: "hasRole", equals: true },
      disabledWhen: { field: "locked", equals: true },
    };
    const prefixed = withNamePrefix(field, "team.1");
    expect(prefixed.visibleWhen?.field).toBe("team.1.hasRole");
    expect(prefixed.disabledWhen?.field).toBe("team.1.locked");
  });

  it("leaves fields without conditions untouched", () => {
    const field: FieldConfig = { type: "text", name: "plain" };
    const prefixed = withNamePrefix(field, "team.2");
    expect(prefixed.visibleWhen).toBeUndefined();
    expect(prefixed.disabledWhen).toBeUndefined();
  });
});
