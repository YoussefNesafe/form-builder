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

  it("toTs emits a typed const and the import, with the config as valid JSON body", () => {
    const ts = toTs(config);
    expect(ts).toContain('import type { FormConfig } from "@/form-builder";');
    expect(ts).toContain("export const config: FormConfig =");
    const body = ts.slice(ts.indexOf("=") + 1).replace(/;\s*$/, "").trim();
    expect(JSON.parse(body)).toEqual(config);
  });

  it("toCode dispatches on mode", () => {
    expect(toCode(config, "json")).toBe(toJson(config));
    expect(toCode(config, "ts")).toBe(toTs(config));
  });
});
