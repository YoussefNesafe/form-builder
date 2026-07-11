import { describe, expect, it } from "vitest";
import { withNamePrefix } from "./GroupField";
import { conditionFieldNames } from "../core/conditions";
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
    expect(conditionFieldNames(prefixed.visibleWhen)).toEqual(["team.1.hasRole"]);
    expect(conditionFieldNames(prefixed.disabledWhen)).toEqual(["team.1.locked"]);
  });

  it("prefixes every leaf across array and anyOf specs", () => {
    const field: FieldConfig = {
      type: "text",
      name: "role",
      visibleWhen: [
        { field: "a", equals: 1 },
        { field: "b", equals: 2 },
      ],
      enabledWhen: { anyOf: [[{ field: "c", equals: 3 }], [{ field: "d", equals: 4 }]] },
    };
    const prefixed = withNamePrefix(field, "team.0");
    expect(conditionFieldNames(prefixed.visibleWhen)).toEqual(["team.0.a", "team.0.b"]);
    expect(conditionFieldNames(prefixed.enabledWhen)).toEqual(["team.0.c", "team.0.d"]);
  });

  it("leaves fields without conditions untouched", () => {
    const field: FieldConfig = { type: "text", name: "plain" };
    const prefixed = withNamePrefix(field, "team.2");
    expect(prefixed.visibleWhen).toBeUndefined();
    expect(prefixed.disabledWhen).toBeUndefined();
    expect(prefixed.enabledWhen).toBeUndefined();
  });
});
