import { describe, expect, it } from "vitest";
import { buildFormSchema, toZodSchema } from "./validation";
import { defaultMessages, mergeMessages } from "./messages";
import type { FieldConfig, FormConfig } from "./types";

const messages = defaultMessages;

function schemaFor(field: FieldConfig) {
  const schema = toZodSchema(field, messages);
  if (!schema) throw new Error("expected schema");
  return schema;
}

describe("text", () => {
  it("required fails empty, passes value", () => {
    const schema = schemaFor({ type: "text", name: "a", required: true });
    expect(schema.safeParse("").success).toBe(false);
    expect(schema.safeParse("x").success).toBe(true);
  });

  it("optional passes undefined and empty string", () => {
    const schema = schemaFor({ type: "text", name: "a" });
    expect(schema.safeParse(undefined).success).toBe(true);
    expect(schema.safeParse("").success).toBe(true);
  });

  it("minLength/maxLength enforced with messages", () => {
    const schema = schemaFor({ type: "text", name: "a", required: true, rules: { minLength: 3, maxLength: 5 } });
    const short = schema.safeParse("ab");
    expect(short.success).toBe(false);
    if (!short.success) expect(short.error.issues[0].message).toBe(messages.minLength(3));
    expect(schema.safeParse("abcdef").success).toBe(false);
    expect(schema.safeParse("abcd").success).toBe(true);
  });

  it("pattern enforced, custom message surfaces", () => {
    const schema = schemaFor({
      type: "text",
      name: "a",
      required: true,
      rules: { pattern: "^[a-z]+$", message: "lowercase only" },
    });
    const result = schema.safeParse("ABC");
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0].message).toBe("lowercase only");
  });

  it("trim: validates and outputs the trimmed value", () => {
    const schema = schemaFor({
      type: "text",
      name: "a",
      required: true,
      rules: { minLength: 2, pattern: "^[A-Za-z ]+$", trim: true },
    });
    const parsed = schema.safeParse("  John Doe  ");
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data).toBe("John Doe");
    // Whitespace-only trims to empty → fails required.
    expect(schema.safeParse("   ").success).toBe(false);
    // Trimmed length below minimum.
    expect(schema.safeParse("  J  ").success).toBe(false);
    expect(schema.safeParse("John1").success).toBe(false);
  });

  it("trim: whitespace-only stays valid-absent for optional fields", () => {
    const schema = schemaFor({ type: "text", name: "a", rules: { minLength: 2, trim: true } });
    const parsed = schema.safeParse("   ");
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data).toBeUndefined();
  });

  it("optional with rules still passes empty", () => {
    const schema = schemaFor({ type: "text", name: "a", rules: { minLength: 3 } });
    expect(schema.safeParse("").success).toBe(true);
    expect(schema.safeParse("ab").success).toBe(false);
  });
});

describe("email", () => {
  it("enforces format", () => {
    const schema = schemaFor({ type: "email", name: "e", required: true });
    expect(schema.safeParse("nope").success).toBe(false);
    expect(schema.safeParse("a@b.co").success).toBe(true);
  });
});

describe("number", () => {
  it("min/max enforced", () => {
    const schema = schemaFor({ type: "number", name: "n", required: true, min: 2, max: 4 });
    expect(schema.safeParse(1).success).toBe(false);
    expect(schema.safeParse(5).success).toBe(false);
    expect(schema.safeParse(3).success).toBe(true);
  });

  it("required rejects undefined, optional accepts", () => {
    expect(schemaFor({ type: "number", name: "n", required: true }).safeParse(undefined).success).toBe(false);
    expect(schemaFor({ type: "number", name: "n" }).safeParse(undefined).success).toBe(true);
  });

  it("optional treats NaN and null as absent (cleared input)", () => {
    const schema = schemaFor({ type: "number", name: "n" });
    expect(schema.safeParse(Number.NaN).success).toBe(true);
    expect(schema.safeParse(null).success).toBe(true);
  });
});

describe("password complexity", () => {
  const field = {
    type: "password",
    name: "pw",
    required: true,
    complexity: { uppercase: true, lowercase: true, number: true, special: true, minLength: 8 },
  } as const;

  it("accepts a password meeting every rule", () => {
    expect(schemaFor(field).safeParse("Abcdef1!").success).toBe(true);
  });

  it.each([
    ["abcdef1!", "1 Uppercase"],
    ["ABCDEF1!", "1 Lowercase"],
    ["Abcdefg!", "1 Number"],
    ["Abcdefg1", "1 Special Char"],
    ["Ab1!", "Min. 8 char."],
  ])("rejects %s with message %s", (value, message) => {
    const result = schemaFor(field).safeParse(value);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.message)).toContain(message);
    }
  });

  it("without complexity keeps plain rules only", () => {
    const schema = schemaFor({ type: "password", name: "pw", required: true });
    expect(schema.safeParse("abc").success).toBe(true);
  });
});

describe("file", () => {
  it("multiple: oversize file errors at the array root with the size message", () => {
    const schema = schemaFor({ type: "file", name: "f", multiple: true, maxSizeMB: 1, required: true });
    const big = new File([new ArrayBuffer(2 * 1024 * 1024)], "big.bin");
    const result = schema.safeParse([big]);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual([]);
      expect(result.error.issues[0].message).toBe(messages.fileSize(1));
    }
    const small = new File([new ArrayBuffer(1024)], "small.bin");
    expect(schema.safeParse([small]).success).toBe(true);
  });
});

describe("otp", () => {
  it("requires exact length", () => {
    const schema = schemaFor({ type: "otp", name: "o", length: 6, required: true });
    expect(schema.safeParse("12345").success).toBe(false);
    expect(schema.safeParse("123456").success).toBe(true);
  });

  it("requires a verified code when a checker is provided", () => {
    const verified = new Map([["o", "123456"]]);
    const schema = toZodSchema(
      { type: "otp", name: "o", length: 6, required: true },
      messages,
      (name, code) => verified.get(name) === code,
    );
    expect(schema!.safeParse("123456").success).toBe(true);
    const stale = schema!.safeParse("654321");
    expect(stale.success).toBe(false);
    if (!stale.success) expect(stale.error.issues[0].message).toBe(messages.otpNotVerified);
  });

  it("length-only without a checker", () => {
    const schema = schemaFor({ type: "otp", name: "o", length: 6, required: true });
    expect(schema.safeParse("654321").success).toBe(true);
  });
});

describe("phone", () => {
  it("required non-empty", () => {
    const schema = schemaFor({ type: "phone", name: "p", required: true });
    expect(schema.safeParse("").success).toBe(false);
    expect(schema.safeParse("+31612345678").success).toBe(true);
  });

  it("validates real number lengths per country", () => {
    const schema = schemaFor({ type: "phone", name: "p", required: true });
    expect(schema.safeParse("+971501095033").success).toBe(true);
    const tooLong = schema.safeParse("+9715010950331");
    expect(tooLong.success).toBe(false);
    if (!tooLong.success) expect(tooLong.error.issues[0].message).toBe(messages.invalidPhone);
    expect(schema.safeParse("+97150109503").success).toBe(false);
    expect(schema.safeParse("123").success).toBe(false);
  });

  it("optional accepts empty but rejects invalid", () => {
    const schema = schemaFor({ type: "phone", name: "p" });
    expect(schema.safeParse("").success).toBe(true);
    expect(schema.safeParse(undefined).success).toBe(true);
    expect(schema.safeParse("+9715010950331").success).toBe(false);
  });
});

describe("select", () => {
  it("single scalar", () => {
    const schema = schemaFor({
      type: "select",
      name: "s",
      required: true,
      options: [{ label: "One", value: 1 }],
    });
    expect(schema.safeParse(1).success).toBe(true);
    const missing = schema.safeParse(undefined);
    expect(missing.success).toBe(false);
    if (!missing.success) expect(missing.error.issues[0].message).toBe(messages.required);
  });

  it("multiple is array, required needs one entry", () => {
    const schema = schemaFor({
      type: "select",
      name: "s",
      required: true,
      multiple: true,
      options: [{ label: "One", value: 1 }],
    });
    expect(schema.safeParse([]).success).toBe(false);
    expect(schema.safeParse([1]).success).toBe(true);
  });

  it("optional single accepts undefined and null (cleared select)", () => {
    const schema = schemaFor({ type: "select", name: "s", options: [{ label: "One", value: 1 }] });
    expect(schema.safeParse(undefined).success).toBe(true);
    expect(schema.safeParse(null).success).toBe(true);
  });
});

describe("radio", () => {
  it("required missing shows required message, not raw zod error", () => {
    const schema = schemaFor({
      type: "radio",
      name: "r",
      required: true,
      options: [{ label: "One", value: 1 }],
    });
    const result = schema.safeParse(undefined);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0].message).toBe(messages.required);
  });
});

describe("checkbox / switch", () => {
  it("required boolean checkbox must be true", () => {
    const schema = schemaFor({ type: "checkbox", name: "c", required: true });
    expect(schema.safeParse(false).success).toBe(false);
    expect(schema.safeParse(true).success).toBe(true);
  });

  it("checkbox group is array", () => {
    const schema = schemaFor({
      type: "checkbox",
      name: "c",
      required: true,
      options: [{ label: "A", value: "a" }],
    });
    expect(schema.safeParse([]).success).toBe(false);
    expect(schema.safeParse(["a"]).success).toBe(true);
  });

  it("switch is boolean", () => {
    const schema = schemaFor({ type: "switch", name: "s" });
    expect(schema.safeParse(true).success).toBe(true);
    expect(schema.safeParse(false).success).toBe(true);
  });
});

describe("date", () => {
  it("single parses ISO string, rejects garbage", () => {
    const schema = schemaFor({ type: "date", name: "d", required: true });
    expect(schema.safeParse("2026-07-05T00:00:00.000Z").success).toBe(true);
    expect(schema.safeParse("not-a-date").success).toBe(false);
  });

  it("minDate/maxDate enforced", () => {
    const schema = schemaFor({
      type: "date",
      name: "d",
      required: true,
      minDate: "2026-01-01",
      maxDate: "2026-12-31",
    });
    expect(schema.safeParse("2025-06-01").success).toBe(false);
    expect(schema.safeParse("2027-06-01").success).toBe(false);
    expect(schema.safeParse("2026-06-01").success).toBe(true);
  });

  it("required single date surfaces the required message when missing", () => {
    const schema = schemaFor({ type: "date", name: "d", required: true });
    const missing = schema.safeParse(undefined);
    expect(missing.success).toBe(false);
    if (!missing.success) expect(missing.error.issues[0].message).toBe(messages.required);
  });

  it("exact boundary days pass regardless of timezone (date-part compare)", () => {
    const schema = schemaFor({
      type: "date",
      name: "d",
      required: true,
      minDate: "2026-01-01",
      maxDate: "2026-12-31",
    });
    // Picks are stored as plain dates; boundaries must be inclusive.
    expect(schema.safeParse("2026-01-01").success).toBe(true);
    expect(schema.safeParse("2026-12-31").success).toBe(true);
    expect(schema.safeParse("2025-12-31").success).toBe(false);
    expect(schema.safeParse("2027-01-01").success).toBe(false);
    // Legacy full-ISO values still compare by date part.
    expect(schema.safeParse("2026-12-31T20:00:00.000Z").success).toBe(true);
  });

  it("range rejects to before from by date part", () => {
    const schema = schemaFor({ type: "date", name: "d", range: true, required: true });
    expect(schema.safeParse({ from: "2026-01-05", to: "2026-01-01" }).success).toBe(false);
    expect(schema.safeParse({ from: "2026-01-05", to: "2026-01-05" }).success).toBe(true);
  });

  it("range needs from and to, errors land at field root with required message", () => {
    const schema = schemaFor({ type: "date", name: "d", range: true, required: true });
    expect(schema.safeParse({ from: "2026-01-01", to: "2026-01-05" }).success).toBe(true);
    const partial = schema.safeParse({ from: "2026-01-01" });
    expect(partial.success).toBe(false);
    if (!partial.success) {
      expect(partial.error.issues[0].message).toBe(messages.required);
      expect(partial.error.issues[0].path).toEqual([]);
    }
    const missing = schema.safeParse(undefined);
    expect(missing.success).toBe(false);
    if (!missing.success) expect(missing.error.issues[0].message).toBe(messages.required);
  });

  it("range rejects from after to", () => {
    const schema = schemaFor({ type: "date", name: "d", range: true, required: true });
    expect(schema.safeParse({ from: "2026-02-01", to: "2026-01-01" }).success).toBe(false);
  });
});

describe("slider", () => {
  it("clamps to min/max", () => {
    const schema = schemaFor({ type: "slider", name: "s", min: 0, max: 10 });
    expect(schema.safeParse(-1).success).toBe(false);
    expect(schema.safeParse(11).success).toBe(false);
    expect(schema.safeParse(5).success).toBe(true);
  });
});

describe("file", () => {
  it("accepts File, enforces maxSizeMB", () => {
    const schema = schemaFor({ type: "file", name: "f", required: true, maxSizeMB: 1 });
    const small = new File(["x"], "small.txt");
    const big = new File([new ArrayBuffer(2 * 1024 * 1024)], "big.bin");
    expect(schema.safeParse(small).success).toBe(true);
    expect(schema.safeParse(big).success).toBe(false);
  });

  it("multiple is array of Files", () => {
    const schema = schemaFor({ type: "file", name: "f", required: true, multiple: true });
    expect(schema.safeParse([new File(["x"], "a.txt")]).success).toBe(true);
    expect(schema.safeParse([]).success).toBe(false);
  });
});

describe("hidden", () => {
  it("passes anything through", () => {
    const schema = schemaFor({ type: "hidden", name: "h", value: "tok" });
    expect(schema.safeParse("whatever").success).toBe(true);
    expect(schema.safeParse(123).success).toBe(true);
  });
});

describe("static / submit excluded", () => {
  it("toZodSchema returns null", () => {
    expect(toZodSchema({ type: "static", name: "s", content: "hi" }, messages)).toBeNull();
    expect(toZodSchema({ type: "submit", name: "go", text: "Go" }, messages)).toBeNull();
  });

  it("buildFormSchema shape lacks those keys", () => {
    const config: FormConfig = {
      id: "t",
      fields: [
        { type: "text", name: "a" },
        { type: "static", name: "s", content: "hi" },
        { type: "submit", name: "go", text: "Go" },
      ],
    };
    const schema = buildFormSchema(config, messages);
    const parsed = schema.safeParse({ a: "x" });
    expect(parsed.success).toBe(true);
    expect(Object.keys(schema.shape)).toEqual(["a"]);
  });
});

describe("group", () => {
  const group: FieldConfig = {
    type: "group",
    name: "team",
    min: 1,
    max: 2,
    fields: [{ type: "text", name: "member", required: true }],
  };

  it("array of row objects with inner rules", () => {
    const schema = schemaFor(group);
    expect(schema.safeParse([{ member: "a" }]).success).toBe(true);
    expect(schema.safeParse([{ member: "" }]).success).toBe(false);
  });

  it("min/max rows enforced", () => {
    const schema = schemaFor(group);
    expect(schema.safeParse([]).success).toBe(false);
    expect(schema.safeParse([{ member: "a" }, { member: "b" }, { member: "c" }]).success).toBe(false);
  });
});

describe("custom field types", () => {
  it("pass through schema as unknown", () => {
    const config: FormConfig = {
      id: "t",
      fields: [{ type: "rating", name: "stars", max: 5 } as never],
    };
    const schema = buildFormSchema(config, messages);
    expect(schema.safeParse({ stars: 4 }).success).toBe(true);
    expect(schema.safeParse({}).success).toBe(true);
  });
});

describe("time", () => {
  it("required rejects empty and malformed values", () => {
    const schema = schemaFor({ type: "time", name: "t", required: true });
    expect(schema.safeParse("").success).toBe(false);
    expect(schema.safeParse("24:00").success).toBe(false);
    expect(schema.safeParse("9:30").success).toBe(false);
    expect(schema.safeParse("09:60").success).toBe(false);
    expect(schema.safeParse("09:30").success).toBe(true);
  });

  it("malformed value surfaces invalidTime message", () => {
    const schema = schemaFor({ type: "time", name: "t", required: true });
    const result = schema.safeParse("24:00");
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0].message).toBe(messages.invalidTime);
  });

  it("minTime/maxTime enforced lexicographically with min/max messages", () => {
    const schema = schemaFor({ type: "time", name: "t", required: true, minTime: "09:00", maxTime: "17:00" });
    const early = schema.safeParse("08:59");
    expect(early.success).toBe(false);
    if (!early.success) expect(early.error.issues[0].message).toBe(messages.min("09:00"));
    const late = schema.safeParse("17:01");
    expect(late.success).toBe(false);
    if (!late.success) expect(late.error.issues[0].message).toBe(messages.max("17:00"));
    expect(schema.safeParse("09:00").success).toBe(true);
    expect(schema.safeParse("17:00").success).toBe(true);
  });

  it("optional treats empty string as absent", () => {
    const schema = schemaFor({ type: "time", name: "t", minTime: "09:00" });
    const parsed = schema.safeParse("");
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data).toBeUndefined();
    expect(schema.safeParse(undefined).success).toBe(true);
    expect(schema.safeParse("08:00").success).toBe(false);
  });
});

describe("rating", () => {
  it("required enforces integer within 1..max", () => {
    const schema = schemaFor({ type: "rating", name: "r", required: true, max: 5 });
    expect(schema.safeParse(undefined).success).toBe(false);
    expect(schema.safeParse(0).success).toBe(false);
    expect(schema.safeParse(6).success).toBe(false);
    expect(schema.safeParse(2.5).success).toBe(false);
    expect(schema.safeParse(1).success).toBe(true);
    expect(schema.safeParse(5).success).toBe(true);
  });

  it("max defaults to 5", () => {
    const schema = schemaFor({ type: "rating", name: "r", required: true });
    expect(schema.safeParse(5).success).toBe(true);
    expect(schema.safeParse(6).success).toBe(false);
  });

  it("optional treats cleared values as absent", () => {
    const schema = schemaFor({ type: "rating", name: "r" });
    expect(schema.safeParse(undefined).success).toBe(true);
    expect(schema.safeParse(null).success).toBe(true);
    expect(schema.safeParse(3).success).toBe(true);
    expect(schema.safeParse(0).success).toBe(false);
  });
});

describe("segmented", () => {
  const options = [
    { label: "Basic", value: "basic" },
    { label: "Pro", value: 2 },
  ];

  it("required accepts only option-typed values, rejects missing", () => {
    const schema = schemaFor({ type: "segmented", name: "plan", required: true, options });
    expect(schema.safeParse(undefined).success).toBe(false);
    expect(schema.safeParse("basic").success).toBe(true);
    expect(schema.safeParse(2).success).toBe(true);
    expect(schema.safeParse(true).success).toBe(false);
  });

  it("optional treats null/cleared as absent", () => {
    const schema = schemaFor({ type: "segmented", name: "plan", options });
    expect(schema.safeParse(undefined).success).toBe(true);
    expect(schema.safeParse(null).success).toBe(true);
    expect(schema.safeParse("basic").success).toBe(true);
  });
});

describe("country", () => {
  it("required accepts ISO members, rejects unknown/lowercase/missing", () => {
    const schema = schemaFor({ type: "country", name: "c", required: true });
    expect(schema.safeParse("NL").success).toBe(true);
    expect(schema.safeParse("XX").success).toBe(false);
    expect(schema.safeParse("nl").success).toBe(false);
    expect(schema.safeParse(undefined).success).toBe(false);
    expect(schema.safeParse("").success).toBe(false);
  });

  it("countries subset restricts accepted values", () => {
    const schema = schemaFor({ type: "country", name: "c", required: true, countries: ["NL", "AE"] });
    expect(schema.safeParse("NL").success).toBe(true);
    expect(schema.safeParse("EG").success).toBe(false);
  });

  it("invalid value surfaces invalidCountry message", () => {
    const schema = schemaFor({ type: "country", name: "c", required: true });
    const result = schema.safeParse("XX");
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0].message).toBe(messages.invalidCountry);
  });

  it("optional treats cleared values as absent", () => {
    const schema = schemaFor({ type: "country", name: "c" });
    expect(schema.safeParse(undefined).success).toBe(true);
    expect(schema.safeParse(null).success).toBe(true);
    expect(schema.safeParse("").success).toBe(true);
    expect(schema.safeParse("NL").success).toBe(true);
  });
});

describe("custom messages", () => {
  it("override default", () => {
    const custom = mergeMessages({ required: "verplicht" });
    const schema = toZodSchema({ type: "text", name: "a", required: true }, custom);
    const result = schema!.safeParse("");
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0].message).toBe("verplicht");
  });
});
