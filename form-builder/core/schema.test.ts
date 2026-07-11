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

  it("accepts array and anyOf condition specs", () =>
    expect(() =>
      validateFormConfig({
        id: "t",
        fields: [
          { type: "text", name: "a" },
          { type: "text", name: "b" },
          {
            type: "text",
            name: "c",
            visibleWhen: [
              { field: "a", equals: "x" },
              { field: "b", notEquals: "y" },
            ],
          },
          {
            type: "text",
            name: "d",
            disabledWhen: { anyOf: [[{ field: "a", equals: "x" }], [{ field: "b", in: ["y"] }]] },
          },
        ],
      }),
    ).not.toThrow());

  it("accepts enabledWhen with isValid conditions", () =>
    expect(() =>
      validateFormConfig({
        id: "t",
        fields: [
          { type: "text", name: "firstName" },
          { type: "text", name: "lastName" },
          {
            type: "email",
            name: "email",
            enabledWhen: [
              { field: "firstName", isValid: true },
              { field: "lastName", isValid: true },
            ],
          },
        ],
      }),
    ).not.toThrow());

  it("rejects isValid inside visibleWhen", () =>
    expect(() =>
      validateFormConfig({
        id: "t",
        fields: [
          { type: "text", name: "a" },
          { type: "text", name: "b", visibleWhen: { field: "a", isValid: true } },
        ],
      }),
    ).toThrow(/isValid/));

  it("rejects a field with both disabledWhen and enabledWhen", () =>
    expect(() =>
      validateFormConfig({
        id: "t",
        fields: [
          { type: "text", name: "a" },
          {
            type: "text",
            name: "b",
            disabledWhen: { field: "a", equals: 1 },
            enabledWhen: { field: "a", equals: 2 },
          },
        ],
      }),
    ).toThrow(/mutually exclusive/));

  it("rejects isValid referencing an unknown or self field", () => {
    expect(() =>
      validateFormConfig({
        id: "t",
        fields: [{ type: "text", name: "a", enabledWhen: { field: "gone", isValid: true } }],
      }),
    ).toThrow(/sibling built-in input field/);
    expect(() =>
      validateFormConfig({
        id: "t",
        fields: [{ type: "text", name: "a", enabledWhen: { field: "a", isValid: true } }],
      }),
    ).toThrow(/sibling built-in input field/);
  });

  it("rejects isValid referencing a custom field", () => {
    registerField("customValidityTarget", () => null);
    expect(() =>
      validateFormConfig({
        id: "t",
        fields: [
          { type: "customValidityTarget", name: "custom" } as never,
          { type: "text", name: "a", enabledWhen: { field: "custom", isValid: true } },
        ],
      }),
    ).toThrow(/sibling built-in input field/);
  });

  it("rejects isValid referencing vacuously-valid types (static, submit, hidden)", () => {
    for (const target of [
      { type: "static", name: "note", content: "hi" },
      { type: "submit", name: "go", text: "Go" },
      { type: "hidden", name: "utm", value: "x" },
    ]) {
      expect(() =>
        validateFormConfig({
          id: "t",
          fields: [
            target as never,
            { type: "text", name: "a", enabledWhen: { field: target.name, isValid: true } },
          ],
        }),
      ).toThrow(/sibling built-in input field/);
    }
  });

  it("rejects empty condition spec arrays and groups", () => {
    expect(() =>
      validateFormConfig({ id: "t", fields: [{ type: "text", name: "a", visibleWhen: [] }] }),
    ).toThrow();
    expect(() =>
      validateFormConfig({ id: "t", fields: [{ type: "text", name: "a", disabledWhen: { anyOf: [] } }] }),
    ).toThrow();
    expect(() =>
      validateFormConfig({ id: "t", fields: [{ type: "text", name: "a", disabledWhen: { anyOf: [[]] } }] }),
    ).toThrow();
  });

  it("accepts valid cross-field rules (matches, date/time bounds)", () =>
    expect(() =>
      validateFormConfig({
        id: "t",
        fields: [
          { type: "password", name: "password" },
          { type: "password", name: "confirm", rules: { matches: "password" } },
          { type: "date", name: "start" },
          { type: "date", name: "end", minDateField: "start" },
          { type: "time", name: "opens" },
          { type: "time", name: "closes", minTimeField: "opens", maxTimeField: "opens" },
        ],
      }),
    ).not.toThrow());

  it("rejects matchesMessage without matches", () =>
    expect(() =>
      validateFormConfig({
        id: "t",
        fields: [{ type: "text", name: "a", rules: { matchesMessage: "orphan" } }],
      }),
    ).toThrow(/matchesMessage requires matches/));

  it("rejects matches referencing unknown, self, or non-text-family fields", () => {
    for (const fields of [
      [{ type: "text", name: "a", rules: { matches: "gone" } }],
      [{ type: "text", name: "a", rules: { matches: "a" } }],
      [
        { type: "number", name: "n" },
        { type: "text", name: "a", rules: { matches: "n" } },
      ],
    ]) {
      expect(() => validateFormConfig({ id: "t", fields: fields as never })).toThrow(
        /compatible sibling field/,
      );
    }
  });

  it("rejects date bounds referencing non-date or range-date siblings", () => {
    expect(() =>
      validateFormConfig({
        id: "t",
        fields: [
          { type: "text", name: "notADate" },
          { type: "date", name: "end", minDateField: "notADate" },
        ],
      }),
    ).toThrow(/compatible sibling field/);
    expect(() =>
      validateFormConfig({
        id: "t",
        fields: [
          { type: "date", name: "span", range: true },
          { type: "date", name: "end", maxDateField: "span" },
        ],
      }),
    ).toThrow(/compatible sibling field/);
  });

  it("rejects date bounds on a range date field itself", () =>
    expect(() =>
      validateFormConfig({
        id: "t",
        fields: [
          { type: "date", name: "start" },
          { type: "date", name: "span", range: true, minDateField: "start" },
        ],
      }),
    ).toThrow(/not supported on range/));

  it("rejects time bounds referencing non-time siblings", () =>
    expect(() =>
      validateFormConfig({
        id: "t",
        fields: [
          { type: "text", name: "a" },
          { type: "time", name: "closes", minTimeField: "a" },
        ],
      }),
    ).toThrow(/compatible sibling field/));

  it("rejects cross-field rules inside groups", () => {
    expect(() =>
      validateFormConfig({
        id: "t",
        fields: [
          {
            type: "group",
            name: "g",
            fields: [
              { type: "text", name: "a" },
              { type: "text", name: "b", rules: { matches: "a" } },
            ],
          },
        ],
      }),
    ).toThrow(/not supported inside groups/);
    expect(() =>
      validateFormConfig({
        id: "t",
        fields: [
          {
            type: "group",
            name: "g",
            fields: [
              { type: "date", name: "start" },
              { type: "date", name: "end", minDateField: "start" },
            ],
          },
        ],
      }),
    ).toThrow(/not supported inside groups/);
  });

  it("accepts copyFrom on a same-type sibling", () =>
    expect(() =>
      validateFormConfig({
        id: "t",
        fields: [
          { type: "text", name: "shipping" },
          { type: "text", name: "billing", copyFrom: "shipping" },
          { type: "select", name: "a", multiple: true, options: [{ label: "X", value: "x" }] },
          { type: "select", name: "b", multiple: true, options: [{ label: "X", value: "x" }], copyFrom: "a" },
        ],
      }),
    ).not.toThrow());

  it("rejects copyFrom referencing unknown, self, or different-type fields", () => {
    for (const fields of [
      [{ type: "text", name: "a", copyFrom: "gone" }],
      [{ type: "text", name: "a", copyFrom: "a" }],
      [
        { type: "number", name: "n" },
        { type: "text", name: "a", copyFrom: "n" },
      ],
    ]) {
      expect(() => validateFormConfig({ id: "t", fields: fields as never })).toThrow(
        /same-type sibling/,
      );
    }
  });

  it("rejects copyFrom shape mismatches (select multiple, date range)", () => {
    expect(() =>
      validateFormConfig({
        id: "t",
        fields: [
          { type: "select", name: "single", options: [{ label: "X", value: "x" }] },
          { type: "select", name: "multi", multiple: true, options: [{ label: "X", value: "x" }], copyFrom: "single" },
        ],
      }),
    ).toThrow(/same-type sibling/);
    expect(() =>
      validateFormConfig({
        id: "t",
        fields: [
          { type: "date", name: "plain" },
          { type: "date", name: "span", range: true, copyFrom: "plain" },
        ],
      }),
    ).toThrow(/same-type sibling/);
  });

  it("rejects copyFrom cycles, allows chains", () => {
    expect(() =>
      validateFormConfig({
        id: "t",
        fields: [
          { type: "text", name: "a", copyFrom: "b" },
          { type: "text", name: "b", copyFrom: "a" },
        ],
      }),
    ).toThrow(/loops back/);
    expect(() =>
      validateFormConfig({
        id: "t",
        fields: [
          { type: "text", name: "c" },
          { type: "text", name: "b", copyFrom: "c" },
          { type: "text", name: "a", copyFrom: "b" },
        ],
      }),
    ).not.toThrow();
  });

  it("rejects copyFrom on unsupported types and inside groups", () => {
    expect(() =>
      validateFormConfig({
        id: "t",
        fields: [
          { type: "password", name: "a" },
          { type: "password", name: "b", copyFrom: "a" },
        ],
      }),
    ).toThrow(/not supported on password/);
    expect(() =>
      validateFormConfig({
        id: "t",
        fields: [
          {
            type: "group",
            name: "g",
            fields: [
              { type: "text", name: "a" },
              { type: "text", name: "b", copyFrom: "a" },
            ],
          },
        ],
      }),
    ).toThrow(/not supported inside groups/);
  });

  it("select: accepts exactly one of options/optionsFrom, rejects both or neither", () => {
    const map = { a: [{ label: "X", value: "x" }] };
    expect(() =>
      validateFormConfig({
        id: "t",
        fields: [
          { type: "select", name: "src", options: [{ label: "A", value: "a" }] },
          { type: "select", name: "dep", optionsFrom: { field: "src", map } },
        ],
      }),
    ).not.toThrow();
    expect(() =>
      validateFormConfig({
        id: "t",
        fields: [
          { type: "select", name: "src", options: [{ label: "A", value: "a" }] },
          {
            type: "select",
            name: "dep",
            options: [{ label: "A", value: "a" }],
            optionsFrom: { field: "src", map },
          },
        ],
      }),
    ).toThrow(/exactly one/);
    expect(() =>
      validateFormConfig({ id: "t", fields: [{ type: "select", name: "dep" }] }),
    ).toThrow(/exactly one/);
  });

  it("rejects optionsFrom referencing unknown, self, multi-select, or non-select sources", () => {
    const map = { a: [{ label: "X", value: "x" }] };
    for (const fields of [
      [{ type: "select", name: "dep", optionsFrom: { field: "gone", map } }],
      [{ type: "select", name: "dep", optionsFrom: { field: "dep", map } }],
      [
        { type: "select", name: "src", multiple: true, options: [{ label: "A", value: "a" }] },
        { type: "select", name: "dep", optionsFrom: { field: "src", map } },
      ],
      [
        { type: "text", name: "src" },
        { type: "select", name: "dep", optionsFrom: { field: "src", map } },
      ],
    ]) {
      expect(() => validateFormConfig({ id: "t", fields: fields as never })).toThrow(
        /single-value select or country field/,
      );
    }
  });

  it("accepts a country field as an optionsFrom source; rejects optionsFrom inside groups", () => {
    expect(() =>
      validateFormConfig({
        id: "t",
        fields: [
          { type: "country", name: "residence" },
          { type: "select", name: "city", optionsFrom: { field: "residence", map: { AE: [{ label: "Dubai", value: "dxb" }] } } },
        ],
      }),
    ).not.toThrow();
    expect(() =>
      validateFormConfig({
        id: "t",
        fields: [
          {
            type: "group",
            name: "g",
            fields: [
              { type: "select", name: "src", options: [{ label: "A", value: "a" }] },
              { type: "select", name: "dep", optionsFrom: { field: "src", map: { a: [] } } },
            ],
          },
        ],
      }),
    ).toThrow(/not supported inside groups/);
  });

  it("rejects optionsFrom cycles, allows chains", () => {
    const map = { a: [{ label: "X", value: "x" }] };
    expect(() =>
      validateFormConfig({
        id: "t",
        fields: [
          { type: "select", name: "a", optionsFrom: { field: "b", map } },
          { type: "select", name: "b", optionsFrom: { field: "a", map } },
        ],
      }),
    ).toThrow(/loops back/);
    expect(() =>
      validateFormConfig({
        id: "t",
        fields: [
          { type: "select", name: "c", options: [{ label: "A", value: "a" }] },
          { type: "select", name: "b", optionsFrom: { field: "c", map } },
          { type: "select", name: "a", optionsFrom: { field: "b", map: { x: [] } } },
        ],
      }),
    ).not.toThrow();
  });

  it("dev-warns when an optionsFrom source sits on a different step", async () => {
    const { vi } = await import("vitest");
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    validateFormConfig({
      id: "t",
      fields: [
        { type: "select", name: "src", options: [{ label: "A", value: "a" }] },
        { type: "select", name: "dep", optionsFrom: { field: "src", map: { a: [{ label: "X", value: "x" }] } } },
      ],
      steps: [
        { title: "one", fieldNames: ["src"] },
        { title: "two", fieldNames: ["dep"] },
      ],
    });
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("derives options from"));
    spy.mockRestore();
  });

  it("dev-warns when a source option value has no map entry", async () => {
    const { vi } = await import("vitest");
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    validateFormConfig({
      id: "t",
      fields: [
        {
          type: "select",
          name: "src",
          options: [
            { label: "A", value: "a" },
            { label: "B", value: "b" },
          ],
        },
        { type: "select", name: "dep", optionsFrom: { field: "src", map: { a: [{ label: "X", value: "x" }] } } },
      ],
    });
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('no map entry for source option "b"'));
    spy.mockRestore();
  });

  it("rejects phone countryFrom pointing at an optionsFrom select", () =>
    expect(() =>
      validateFormConfig({
        id: "t",
        fields: [
          { type: "select", name: "src", options: [{ label: "A", value: "AE" }] },
          { type: "select", name: "dyn", optionsFrom: { field: "src", map: { AE: [{ label: "AE", value: "AE" }] } } },
          { type: "phone", name: "mobile", countryFrom: "dyn" },
        ],
      }),
    ).toThrow(/cannot be verified as country codes/));

  it("dev-warns when a copyFrom source sits on a different step", async () => {
    const { vi } = await import("vitest");
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    validateFormConfig({
      id: "t",
      fields: [
        { type: "text", name: "shipping" },
        { type: "text", name: "billing", copyFrom: "shipping" },
      ],
      steps: [
        { title: "one", fieldNames: ["shipping"] },
        { title: "two", fieldNames: ["billing"] },
      ],
    });
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("copies from"));
    spy.mockRestore();
  });

  it("dev-warns when a cross-field rule source sits on a different step", async () => {
    const { vi } = await import("vitest");
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    validateFormConfig({
      id: "t",
      fields: [
        { type: "password", name: "password" },
        { type: "password", name: "confirm", rules: { matches: "password" } },
      ],
      steps: [
        { title: "one", fieldNames: ["password"] },
        { title: "two", fieldNames: ["confirm"] },
      ],
    });
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("rules.matches"));
    spy.mockRestore();
  });

  it("review steps: accepted without fieldNames, rejected with them or when a step has neither", () => {
    expect(() =>
      validateFormConfig({
        id: "t",
        fields: [{ type: "text", name: "a" }],
        steps: [
          { title: "one", fieldNames: ["a"] },
          { title: "review", review: true },
        ],
      }),
    ).not.toThrow();
    expect(() =>
      validateFormConfig({
        id: "t",
        fields: [{ type: "text", name: "a" }],
        steps: [{ title: "bad", review: true, fieldNames: ["a"] }],
      }),
    ).toThrow(/review: true instead/);
    expect(() =>
      validateFormConfig({
        id: "t",
        fields: [{ type: "text", name: "a" }],
        steps: [{ title: "empty" } as never, { title: "one", fieldNames: ["a"] }],
      }),
    ).toThrow(/review: true instead/);
  });

  it("review steps do not satisfy the every-field-in-a-step rule", () =>
    expect(() =>
      validateFormConfig({
        id: "t",
        fields: [
          { type: "text", name: "a" },
          { type: "text", name: "unassigned" },
        ],
        steps: [
          { title: "one", fieldNames: ["a"] },
          { title: "review", review: true },
        ],
      }),
    ).toThrow(/not assigned to any step/));

  it("step visibleWhen accepts value specs and rejects isValid", () => {
    expect(() =>
      validateFormConfig({
        id: "t",
        fields: [
          { type: "checkbox", name: "extras" },
          { type: "text", name: "a" },
        ],
        steps: [
          { title: "one", fieldNames: ["extras"] },
          { title: "two", fieldNames: ["a"], visibleWhen: [{ field: "extras", equals: true }] },
        ],
      }),
    ).not.toThrow();
    expect(() =>
      validateFormConfig({
        id: "t",
        fields: [
          { type: "text", name: "src" },
          { type: "text", name: "a" },
        ],
        steps: [
          { title: "one", fieldNames: ["src"] },
          { title: "two", fieldNames: ["a"], visibleWhen: { field: "src", isValid: true } },
        ],
      }),
    ).toThrow(/isValid/);
  });

  it("dev-warns when a step's visibility source lives on a later step", async () => {
    const { vi } = await import("vitest");
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    validateFormConfig({
      id: "t",
      fields: [
        { type: "text", name: "a" },
        { type: "checkbox", name: "late" },
      ],
      steps: [
        { title: "one", fieldNames: ["a"], visibleWhen: { field: "late", equals: true } },
        { title: "two", fieldNames: ["late"] },
      ],
    });
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("later step"));
    spy.mockRestore();
  });

  it("dev-warns when every step is conditional", async () => {
    const { vi } = await import("vitest");
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    validateFormConfig({
      id: "t",
      fields: [
        { type: "checkbox", name: "a" },
        { type: "checkbox", name: "b" },
      ],
      steps: [
        { title: "one", fieldNames: ["a"], visibleWhen: { field: "b", equals: true } },
        { title: "two", fieldNames: ["b"], visibleWhen: { field: "a", equals: true } },
      ],
    });
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("hide the whole wizard"));
    spy.mockRestore();
  });

  it("dev-warns when an isValid source sits on a different step", async () => {
    const { vi } = await import("vitest");
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    validateFormConfig({
      id: "t",
      fields: [
        { type: "text", name: "firstName" },
        { type: "email", name: "email", enabledWhen: { field: "firstName", isValid: true } },
      ],
      steps: [
        { title: "one", fieldNames: ["firstName"] },
        { title: "two", fieldNames: ["email"] },
      ],
    });
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("gated on validity"));
    spy.mockRestore();
  });

  it("rejects isValid conditions inside groups", () =>
    expect(() =>
      validateFormConfig({
        id: "t",
        fields: [
          {
            type: "group",
            name: "team",
            fields: [
              { type: "text", name: "member" },
              { type: "text", name: "role", enabledWhen: { field: "member", isValid: true } },
            ],
          },
        ],
      }),
    ).toThrow(/inside groups/));

  it("plain value conditions still work inside groups", () =>
    expect(() =>
      validateFormConfig({
        id: "t",
        fields: [
          {
            type: "group",
            name: "team",
            fields: [
              { type: "checkbox", name: "other" },
              { type: "text", name: "details", visibleWhen: [{ field: "other", equals: true }] },
            ],
          },
        ],
      }),
    ).not.toThrow());

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

describe("signature config", () => {
  it("accepts a valid signature field", () =>
    expect(() =>
      validateFormConfig({
        id: "t",
        fields: [{ type: "signature", name: "sign", penColor: "#1d4ed8", heightPx: 200 }],
      }),
    ).not.toThrow());

  it("rejects non-positive or fractional heightPx", () => {
    expect(() =>
      validateFormConfig({ id: "t", fields: [{ type: "signature", name: "s", heightPx: 0 }] }),
    ).toThrow();
    expect(() =>
      validateFormConfig({ id: "t", fields: [{ type: "signature", name: "s", heightPx: 120.5 }] }),
    ).toThrow();
  });

  it("rejects an empty penColor", () =>
    expect(() =>
      validateFormConfig({ id: "t", fields: [{ type: "signature", name: "s", penColor: "" }] }),
    ).toThrow());
});

describe("masked config", () => {
  it("accepts a valid masked field", () =>
    expect(() =>
      validateFormConfig({
        id: "t",
        fields: [{ type: "masked", name: "card", mask: "#### #### #### ####" }],
      }),
    ).not.toThrow());

  it("rejects an empty mask", () =>
    expect(() =>
      validateFormConfig({ id: "t", fields: [{ type: "masked", name: "card", mask: "" }] }),
    ).toThrow());

  it("rejects a mask without token chars", () =>
    expect(() =>
      validateFormConfig({ id: "t", fields: [{ type: "masked", name: "card", mask: "----" }] }),
    ).toThrow(/token/));

  it("rejects a masked field without a mask", () =>
    expect(() =>
      validateFormConfig({ id: "t", fields: [{ type: "masked", name: "card" } as never] }),
    ).toThrow());
});

describe("country config", () => {
  it("accepts a valid country field", () =>
    expect(() =>
      validateFormConfig({
        id: "t",
        fields: [
          { type: "country", name: "residence", countries: ["NL", "AE"], preferredCountries: ["AE"] },
        ],
      }),
    ).not.toThrow());

  it("accepts a country field with no restriction (all ISO countries)", () =>
    expect(() => validateFormConfig({ id: "t", fields: [{ type: "country", name: "residence" }] })).not.toThrow());

  it("rejects invalid ISO codes in countries and preferredCountries", () => {
    expect(() =>
      validateFormConfig({ id: "t", fields: [{ type: "country", name: "r", countries: ["XX"] }] }),
    ).toThrow(/country code/);
    expect(() =>
      validateFormConfig({ id: "t", fields: [{ type: "country", name: "r", preferredCountries: ["UAE"] }] }),
    ).toThrow(/country code/);
  });

  it("rejects preferredCountries outside the countries subset", () =>
    expect(() =>
      validateFormConfig({
        id: "t",
        fields: [{ type: "country", name: "r", countries: ["NL"], preferredCountries: ["AE"] }],
      }),
    ).toThrow(/preferredCountries/));

  it("rejects an empty countries list", () =>
    expect(() =>
      validateFormConfig({ id: "t", fields: [{ type: "country", name: "r", countries: [] }] }),
    ).toThrow());
});

describe("phone countryFrom with country source", () => {
  it("accepts a phone field syncing from a sibling country field", () =>
    expect(() =>
      validateFormConfig({
        id: "f",
        fields: [
          { type: "country", name: "residence" },
          { type: "phone", name: "mobile", countryFrom: "residence" },
        ],
      }),
    ).not.toThrow());

  it("still rejects non-select non-country sources", () =>
    expect(() =>
      validateFormConfig({
        id: "f",
        fields: [
          { type: "text", name: "residence" },
          { type: "phone", name: "mobile", countryFrom: "residence" },
        ],
      }),
    ).toThrow(/single-value select/));
});

describe("segmented config", () => {
  it("accepts a valid segmented field", () =>
    expect(() =>
      validateFormConfig({
        id: "t",
        fields: [
          {
            type: "segmented",
            name: "plan",
            options: [
              { label: "Basic", value: "basic" },
              { label: "Pro", value: 2 },
            ],
          },
        ],
      }),
    ).not.toThrow());

  it("rejects a segmented field without options", () => {
    expect(() =>
      validateFormConfig({ id: "t", fields: [{ type: "segmented", name: "plan" } as never] }),
    ).toThrow();
    expect(() =>
      validateFormConfig({ id: "t", fields: [{ type: "segmented", name: "plan", options: [] }] }),
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
