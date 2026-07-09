import { describe, expect, it } from "vitest";
import { registerField } from "./registry";
import { validateFormConfig } from "./schema";
import type { FieldConfig, FormConfig } from "./types";

const valid: FormConfig = {
  id: "t",
  fields: [
    { type: "text", name: "first" },
    { type: "select", name: "color", options: [{ label: "Red", value: "red" }] },
    { type: "group", name: "team", fields: [{ type: "text", name: "member" }] },
  ],
};

describe("validateFormConfig", () => {
  it("accepts a valid config", () => expect(() => validateFormConfig(valid)).not.toThrow());

  it("rejects missing name", () =>
    expect(() => validateFormConfig({ id: "t", fields: [{ type: "text" } as never] })).toThrow(/name/));

  it("rejects unknown type", () =>
    expect(() => validateFormConfig({ id: "t", fields: [{ type: "wat", name: "x" } as never] })).toThrow(/wat/));

  it("rejects duplicate names at same level", () =>
    expect(() =>
      validateFormConfig({
        id: "t",
        fields: [
          { type: "text", name: "a" },
          { type: "text", name: "a" },
        ],
      }),
    ).toThrow(/duplicate/i));

  it("accepts width as a plain value and as a per-breakpoint object", () =>
    expect(() =>
      validateFormConfig({
        id: "t",
        fields: [
          { type: "text", name: "a", width: "half" },
          { type: "text", name: "b", width: { tablet: "third", desktop: "quarter" } },
        ],
      }),
    ).not.toThrow());

  it("rejects invalid width values", () =>
    expect(() =>
      validateFormConfig({ id: "t", fields: [{ type: "text", name: "a", width: "double" as never }] }),
    ).toThrow());

  it("rejects unknown width breakpoints", () =>
    expect(() =>
      validateFormConfig({
        id: "t",
        fields: [{ type: "text", name: "a", width: { phablet: "half" } as never }],
      }),
    ).toThrow());

  it("rejects field names containing dots", () =>
    expect(() =>
      validateFormConfig({ id: "t", fields: [{ type: "text", name: "a.b" }] }),
    ).toThrow(/dots/));

  it("rejects nested-quantifier patterns (ReDoS heuristic)", () =>
    expect(() =>
      validateFormConfig({
        id: "t",
        fields: [{ type: "text", name: "a", rules: { pattern: "(a+)+$" } }],
      }),
    ).toThrow(/nested quantifier/));

  it("rejects patterns longer than 256 chars", () =>
    expect(() =>
      validateFormConfig({
        id: "t",
        fields: [{ type: "text", name: "a", rules: { pattern: "a".repeat(257) } }],
      }),
    ).toThrow(/too long/));

  it("rejects allow bodies that escape the character class", () =>
    expect(() =>
      validateFormConfig({
        id: "t",
        fields: [{ type: "text", name: "a", rules: { allow: "\\d][\\s\\S" } }],
      }),
    ).toThrow(/character-class/));

  it("accepts a plain allow body with ranges and escapes", () =>
    validateFormConfig({
      id: "t",
      fields: [{ type: "text", name: "a", rules: { allow: "A-Za-z0-9 \\-" } }],
    }));

  it("rejects invalid phone country codes", () =>
    expect(() =>
      validateFormConfig({
        id: "t",
        fields: [{ type: "phone", name: "p", defaultCountry: "UAE" }],
      }),
    ).toThrow(/country code/));

  it("rejects non yyyy-MM-dd date bounds", () =>
    expect(() =>
      validateFormConfig({
        id: "t",
        fields: [{ type: "date", name: "d", minDate: "2026-1-5" }],
      }),
    ).toThrow());

  it("rejects otp without length", () =>
    expect(() => validateFormConfig({ id: "t", fields: [{ type: "otp", name: "code" } as never] })).toThrow());

  it("accepts otp dependsOn referencing a sibling field", () =>
    validateFormConfig({
      id: "t",
      fields: [
        { type: "phone", name: "phone" },
        { type: "otp", name: "code", length: 6, dependsOn: "phone" },
      ],
    }));

  it("rejects otp dependsOn referencing an unknown field", () =>
    expect(() =>
      validateFormConfig({
        id: "t",
        fields: [{ type: "otp", name: "code", length: 6, dependsOn: "ghost" }],
      }),
    ).toThrow(/dependsOn/));

  it("accepts enabledWhenVerified referencing a sibling otp field", () =>
    validateFormConfig({
      id: "t",
      fields: [
        { type: "otp", name: "emailOtp", length: 6 },
        { type: "phone", name: "phone", enabledWhenVerified: "emailOtp" },
      ],
    }));

  it("allows plain otp inside groups but rejects verification wiring there", () => {
    validateFormConfig({
      id: "t",
      fields: [{ type: "group", name: "g", fields: [{ type: "otp", name: "code", length: 4 }] }],
    });
    expect(() =>
      validateFormConfig({
        id: "t",
        fields: [
          {
            type: "group",
            name: "g",
            fields: [
              { type: "phone", name: "phone" },
              { type: "otp", name: "code", length: 4, dependsOn: "phone" },
            ],
          },
        ],
      }),
    ).toThrow(/not supported inside groups/);
    expect(() =>
      validateFormConfig({
        id: "t",
        fields: [
          { type: "otp", name: "outer", length: 4 },
          {
            type: "group",
            name: "g",
            fields: [{ type: "text", name: "t", enabledWhenVerified: "outer" }],
          },
        ],
      }),
    ).toThrow(/not supported inside groups/);
  });

  it("rejects enabledWhenVerified referencing a non-otp field", () =>
    expect(() =>
      validateFormConfig({
        id: "t",
        fields: [
          { type: "text", name: "email" },
          { type: "phone", name: "phone", enabledWhenVerified: "email" },
        ],
      }),
    ).toThrow(/enabledWhenVerified/));

  it("recurses into groups", () =>
    expect(() =>
      validateFormConfig({
        id: "t",
        fields: [{ type: "group", name: "g", fields: [{ type: "text" } as never] }],
      }),
    ).toThrow(/name/));

  it("warns when an otp field and its dependsOn source sit on different steps", async () => {
    const { vi } = await import("vitest");
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    validateFormConfig({
      id: "t",
      fields: [
        { type: "phone", name: "phone" },
        { type: "otp", name: "code", length: 6, dependsOn: "phone" },
      ],
      steps: [
        { title: "one", fieldNames: ["phone"] },
        { title: "two", fieldNames: ["code"] },
      ],
    });
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("depends on"));
    spy.mockRestore();
  });

  it("rejects steps referencing unknown fieldNames", () =>
    expect(() =>
      validateFormConfig({ ...valid, steps: [{ title: "s1", fieldNames: ["nope"] }] }),
    ).toThrow(/nope/));

  it("rejects unknown props (typo guard)", () =>
    expect(() =>
      validateFormConfig({
        id: "t",
        fields: [{ type: "file", name: "cv", maxSize: 5 } as never],
      }),
    ).toThrow(/maxSize/));

  it("rejects hidden field without value", () =>
    expect(() =>
      validateFormConfig({ id: "t", fields: [{ type: "hidden", name: "token" } as never] }),
    ).toThrow(/value/));

  it("rejects condition without any operator", () =>
    expect(() =>
      validateFormConfig({
        id: "t",
        fields: [{ type: "text", name: "a", visibleWhen: { field: "b" } }],
      }),
    ).toThrow(/operator/i));

  it("rejects invalid regex pattern", () =>
    expect(() =>
      validateFormConfig({
        id: "t",
        fields: [{ type: "text", name: "a", rules: { pattern: "[unclosed" } }],
      }),
    ).toThrow(/pattern/i));

  it("accepts custom registered field types (BaseField contract only)", () => {
    registerField("probe-field", () => null);
    expect(() =>
      validateFormConfig({
        id: "t",
        fields: [{ type: "probe-field", name: "stars", max: 5 }],
      }),
    ).not.toThrow();
  });

  it("custom registered type still requires a name", () => {
    registerField("probe-field", () => null);
    expect(() =>
      validateFormConfig({ id: "t", fields: [{ type: "probe-field" } as never] }),
    ).toThrow(/name/);
  });

  it("rejects fields not assigned to any step", () =>
    expect(() =>
      validateFormConfig({
        ...valid,
        steps: [{ title: "s1", fieldNames: ["first", "color"] }],
      }),
    ).toThrow(/team/));

  it("rejects hidden/submit fields listed in steps", () =>
    expect(() =>
      validateFormConfig({
        id: "t",
        fields: [
          { type: "text", name: "a" },
          { type: "submit", name: "go", text: "Go" },
        ],
        steps: [{ title: "s1", fieldNames: ["a", "go"] }],
      }),
    ).toThrow(/go/));
});

describe("phone countryFrom", () => {
  const residence: FieldConfig = {
    type: "select",
    name: "residence",
    options: [
      { label: "United Arab Emirates", value: "AE" },
      { label: "Egypt", value: "EG" },
    ],
  };

  it("accepts a phone field with countryFrom referencing a sibling ISO select", () => {
    expect(() =>
      validateFormConfig({
        id: "f",
        fields: [residence, { type: "phone", name: "mobile", countryFrom: "residence" }],
      } as FormConfig),
    ).not.toThrow();
  });

  it("rejects an empty countryFrom", () => {
    expect(() =>
      validateFormConfig({
        id: "f",
        fields: [residence, { type: "phone", name: "mobile", countryFrom: "" }],
      } as FormConfig),
    ).toThrow(/countryFrom/);
  });

  it("rejects countryFrom referencing an unknown field", () => {
    expect(() =>
      validateFormConfig({
        id: "f",
        fields: [{ type: "phone", name: "mobile", countryFrom: "nope" }],
      } as FormConfig),
    ).toThrow(/references unknown field "nope"/);
  });

  it("rejects countryFrom referencing itself", () => {
    expect(() =>
      validateFormConfig({
        id: "f",
        fields: [{ type: "phone", name: "mobile", countryFrom: "mobile" }],
      } as FormConfig),
    ).toThrow(/references unknown field "mobile"/);
  });

  it("rejects countryFrom referencing a non-select field", () => {
    expect(() =>
      validateFormConfig({
        id: "f",
        fields: [
          { type: "text", name: "residence" },
          { type: "phone", name: "mobile", countryFrom: "residence" },
        ],
      } as FormConfig),
    ).toThrow(/single-value select/);
  });

  it("rejects countryFrom referencing a multiple select", () => {
    expect(() =>
      validateFormConfig({
        id: "f",
        fields: [
          { ...residence, multiple: true },
          { type: "phone", name: "mobile", countryFrom: "residence" },
        ],
      } as FormConfig),
    ).toThrow(/single-value select/);
  });

  it("rejects a source select whose option values are not ISO alpha-2 codes", () => {
    expect(() =>
      validateFormConfig({
        id: "f",
        fields: [
          { type: "select", name: "residence", options: [{ label: "Egypt", value: "Egypt" }] },
          { type: "phone", name: "mobile", countryFrom: "residence" },
        ],
      } as FormConfig),
    ).toThrow(/ISO 3166-1 alpha-2/);
  });

  it("rejects a source select with a numeric option value", () => {
    expect(() =>
      validateFormConfig({
        id: "f",
        fields: [
          { type: "select", name: "residence", options: [{ label: "Egypt", value: 20 }] },
          { type: "phone", name: "mobile", countryFrom: "residence" },
        ],
      } as FormConfig),
    ).toThrow(/ISO 3166-1 alpha-2/);
  });

  it("dev-warns when phone and its countryFrom source are on different steps", async () => {
    const { vi } = await import("vitest");
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    validateFormConfig({
      id: "f",
      fields: [
        residence,
        { type: "phone", name: "mobile", countryFrom: "residence" },
        { type: "submit", name: "go", text: "Go" },
      ],
      steps: [
        { title: "One", fieldNames: ["residence"] },
        { title: "Two", fieldNames: ["mobile"] },
      ],
    } as FormConfig);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("syncs country from"));
    spy.mockRestore();
  });

  it("rejects countryFrom on a phone field inside a group", () => {
    expect(() =>
      validateFormConfig({
        id: "f",
        fields: [
          residence,
          {
            type: "group",
            name: "contacts",
            fields: [{ type: "phone", name: "mobile", countryFrom: "residence" }],
          },
        ],
      } as FormConfig),
    ).toThrow(/not supported inside groups/);
  });
});

describe("time config", () => {
  it("accepts a valid time field", () =>
    expect(() =>
      validateFormConfig({
        id: "t",
        fields: [{ type: "time", name: "meeting", minTime: "09:00", maxTime: "17:30", stepMinutes: 15 }],
      }),
    ).not.toThrow());

  it("rejects out-of-range minTime", () =>
    expect(() =>
      validateFormConfig({ id: "t", fields: [{ type: "time", name: "m", minTime: "25:00" }] }),
    ).toThrow(/HH:mm/));

  it("rejects non-zero-padded maxTime", () =>
    expect(() =>
      validateFormConfig({ id: "t", fields: [{ type: "time", name: "m", maxTime: "9:00" }] }),
    ).toThrow(/HH:mm/));

  it("rejects minTime after maxTime", () =>
    expect(() =>
      validateFormConfig({
        id: "t",
        fields: [{ type: "time", name: "m", minTime: "17:00", maxTime: "09:00" }],
      }),
    ).toThrow(/minTime/));

  it("rejects non-positive or fractional stepMinutes", () => {
    expect(() =>
      validateFormConfig({ id: "t", fields: [{ type: "time", name: "m", stepMinutes: 0 }] }),
    ).toThrow();
    expect(() =>
      validateFormConfig({ id: "t", fields: [{ type: "time", name: "m", stepMinutes: 7.5 }] }),
    ).toThrow();
  });
});

describe("rating config", () => {
  it("accepts a valid rating field", () =>
    expect(() =>
      validateFormConfig({ id: "t", fields: [{ type: "rating", name: "stars", max: 7 }] }),
    ).not.toThrow());

  it("accepts a rating field without max (defaults to 5)", () =>
    expect(() => validateFormConfig({ id: "t", fields: [{ type: "rating", name: "stars" }] })).not.toThrow());

  it("rejects max below 2, above 10, or fractional", () => {
    expect(() =>
      validateFormConfig({ id: "t", fields: [{ type: "rating", name: "s", max: 1 }] }),
    ).toThrow();
    expect(() =>
      validateFormConfig({ id: "t", fields: [{ type: "rating", name: "s", max: 11 }] }),
    ).toThrow();
    expect(() =>
      validateFormConfig({ id: "t", fields: [{ type: "rating", name: "s", max: 3.5 }] }),
    ).toThrow();
  });
});
