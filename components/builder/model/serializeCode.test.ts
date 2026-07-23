import { describe, it, expect } from "vitest";
import type { FormConfig } from "@/form-builder";
import { toTs, toJson, toCode } from "./serializeCode";

const config: FormConfig = {
  id: "demo",
  title: "Demo",
  fields: [{ type: "text", name: "email", label: "Email" }],
};

describe("code serializers", () => {
  it("toJson round-trips", () => {
    expect(JSON.parse(toJson(config))).toEqual(config);
  });

  it("toTs wraps the config in defineForm, imports it, and emits a Values alias", () => {
    const ts = toTs(config);
    expect(ts).toContain("defineForm(");
    expect(ts).toMatch(/import \{[^}]*defineForm[^}]*\} from ["']@\/form-builder["']/);
    expect(ts).toMatch(/import \{[^}]*InferValues[^}]*\} from ["']@\/form-builder["']/);
    expect(ts).toContain("export const config = defineForm(");
    expect(ts).toContain("export type Values = InferValues<typeof config>;");
  });

  it("toTs's defineForm(...) body is the config as valid JSON", () => {
    const ts = toTs(config);
    const start = ts.indexOf("defineForm(") + "defineForm(".length;
    const end = ts.indexOf(");", start);
    const body = ts.slice(start, end).trim();
    expect(JSON.parse(body)).toEqual(config);
  });

  it("toCode dispatches on mode", () => {
    expect(toCode(config, "json")).toBe(toJson(config));
    expect(toCode(config, "ts")).toBe(toTs(config));
  });
});
