import { afterEach, describe, expect, it, vi } from "vitest";
import { multiStepSignupConfig } from "@/app/(site)/examples/multi-step-signup/config";
import { conditionalProfileConfig } from "@/app/(site)/examples/conditional-profile/config";
import { advancedFieldsConfig } from "@/app/(site)/examples/advanced-fields/config";
import { buildDefaultValues } from "./defaults";
import { defaultMessages } from "./messages";
import { GENERIC_SUBMISSION_ERROR, parseSubmission } from "./parseSubmission";
import { registerField } from "./registry";
import type { FieldComponentProps } from "./registry";
import { applyServerErrors } from "./serverErrors";
import type { FormConfig, FormValues } from "./types";
import { buildResolverSchema } from "./validation";
import type { OtpVerifiedChecker } from "./validation";

const REGISTRY_KEY = Symbol.for("form-builder.fieldRegistry.v1");
afterEach(() => {
  delete (globalThis as unknown as Record<symbol, unknown>)[REGISTRY_KEY];
});

const baseConfig: FormConfig = {
  id: "signup",
  fields: [
    { type: "text", name: "firstName", required: true },
    { type: "email", name: "email", required: true },
  ],
};

describe("parseSubmission — invalid_body", () => {
  it.each([["array", []], ["string", "nope"], ["number", 5], ["null", null], ["undefined", undefined]])(
    "rejects a %s body without throwing",
    (_label, body) => {
      const result = parseSubmission(baseConfig, body);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.code).toBe("invalid_body");
        expect(result.errors.formError).toBe(GENERIC_SUBMISSION_ERROR);
        expect(result.errors.fieldErrors).toBeUndefined();
        expect(result.unvalidated).toEqual([]);
      }
    },
  );

  it("accepts a plain object body", () => {
    const result = parseSubmission(baseConfig, { firstName: "Ada", email: "ada@example.com" });
    expect(result.ok).toBe(true);
  });
});

describe("parseSubmission — malformed config throws", () => {
  it("propagates validateFormConfig's throw instead of returning ok:false", () => {
    const bad = { id: "t", fields: [{ type: "wat", name: "x" }] } as unknown as FormConfig;
    expect(() => parseSubmission(bad, {})).toThrow(/wat/);
  });
});

describe("parseSubmission — prototype pollution scrub", () => {
  it("scrubs a top-level __proto__ key without polluting Object.prototype", () => {
    const malicious = JSON.parse('{"firstName":"Ada","email":"ada@example.com","__proto__":{"polluted":true}}');
    const result = parseSubmission(baseConfig, malicious);
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.values).toEqual({ firstName: "Ada", email: "ada@example.com" });
    }
  });

  it("scrubs __proto__/constructor/prototype keys inside group rows", () => {
    const config: FormConfig = {
      id: "t",
      fields: [{ type: "group", name: "team", fields: [{ type: "text", name: "role", required: true }] }],
    };
    const malicious = JSON.parse(
      '{"team":[{"role":"lead","__proto__":{"polluted":true},"constructor":{"x":1}}]}',
    );
    const result = parseSubmission(config, malicious);
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.values.team).toEqual([{ role: "lead" }]);
    }
  });
});

describe("parseSubmission — otp nested in group", () => {
  it("rejects a bare otp field inside a group", () => {
    const config: FormConfig = {
      id: "t",
      fields: [{ type: "group", name: "team", fields: [{ type: "otp", name: "code", length: 6 }] }],
    };
    const result = parseSubmission(config, { team: [{ code: "123456" }] });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("otp_in_group");
      expect(result.errors.formError).toBe(GENERIC_SUBMISSION_ERROR);
    }
  });

  it("rejects otp nested inside a group nested inside another group", () => {
    const config: FormConfig = {
      id: "t",
      fields: [
        {
          type: "group",
          name: "outer",
          fields: [{ type: "group", name: "inner", fields: [{ type: "otp", name: "code", length: 4 }] }],
        },
      ],
    };
    const result = parseSubmission(config, {});
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("otp_in_group");
  });

  it("does not reject a top-level otp field (only group-nested ones)", () => {
    const config: FormConfig = {
      id: "t",
      fields: [{ type: "otp", name: "code", length: 4, required: true }],
    };
    const result = parseSubmission(config, { code: "1234" }, { otpVerified: () => true });
    expect(result.ok).toBe(true);
  });
});

describe("parseSubmission — hidden field re-injection", () => {
  const config: FormConfig = {
    id: "t",
    fields: [
      { type: "hidden", name: "source", value: "campaign-x" },
      {
        type: "text",
        name: "promoCode",
        required: true,
        visibleWhen: { field: "source", equals: "campaign-x" },
      },
    ],
  };

  it("ignores a client-supplied override and uses the config's constant", () => {
    const result = parseSubmission(config, { source: "attacker-value", promoCode: "SAVE10" });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.values.source).toBe("campaign-x");
  });

  it("uses the injected hidden value as a visibleWhen source before validating other fields", () => {
    const result = parseSubmission(config, {});
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("validation_failed");
      expect(result.errors.fieldErrors?.promoCode).toBe(defaultMessages.required);
    }
  });

  it("re-asserts the hidden value in ok:true output", () => {
    const result = parseSubmission(config, { promoCode: "SAVE10" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.values).toEqual({ source: "campaign-x", promoCode: "SAVE10" });
    }
  });
});

describe("parseSubmission — maxStringLength", () => {
  it("rejects a string over the default 10_000 cap", () => {
    const result = parseSubmission(baseConfig, { firstName: "a".repeat(10_001), email: "x@example.com" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("input_too_large");
      expect(result.errors.formError).not.toMatch(/10.?000|10.?001/);
    }
  });

  it("accepts a string at the default cap boundary", () => {
    const result = parseSubmission(baseConfig, { firstName: "a".repeat(10_000), email: "x@example.com" });
    expect(result.ok).toBe(true);
  });

  it("honors a custom maxStringLength", () => {
    const result = parseSubmission(
      baseConfig,
      { firstName: "abcdef", email: "x@example.com" },
      { maxStringLength: 5 },
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("input_too_large");
  });

  it("checks nested strings inside group rows too", () => {
    const config: FormConfig = {
      id: "t",
      fields: [{ type: "group", name: "team", fields: [{ type: "text", name: "role" }] }],
    };
    const result = parseSubmission(config, { team: [{ role: "x".repeat(6) }] }, { maxStringLength: 5 });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("input_too_large");
  });
});

describe("parseSubmission — file fields", () => {
  const config: FormConfig = {
    id: "t",
    fields: [
      { type: "text", name: "firstName", required: true },
      { type: "file", name: "resume", required: true },
    ],
  };

  it("omits file fields from SCHEMA validation but still passes a submitted value through in `values` (MAJOR 2: unvalidated[] means exactly one thing for every row, files included)", () => {
    const resume = { key: "uploads/resume.pdf", size: 12345, contentType: "application/pdf" };
    const result = parseSubmission(config, { firstName: "Ada", resume });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.unvalidated).toEqual(["resume"]);
      expect(result.values).toEqual({ firstName: "Ada", resume });
    }
  });

  it("does not synthesize a resume key when the client never sent one", () => {
    const result = parseSubmission(config, { firstName: "Ada" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.unvalidated).toEqual(["resume"]);
      expect(result.values).toEqual({ firstName: "Ada" });
      expect(result.values).not.toHaveProperty("resume");
    }
  });
});

describe("parseSubmission — custom field types", () => {
  const Widget = ({ field }: FieldComponentProps) => field.name;

  it("passes a registered custom field through as unvalidated/unknown", () => {
    registerField("my-widget", Widget);
    const config: FormConfig = {
      id: "t",
      fields: [
        { type: "text", name: "firstName", required: true },
        { type: "my-widget", name: "gizmo", anything: "goes" } as never,
      ],
    };
    const result = parseSubmission(config, { firstName: "Ada", gizmo: { whatever: 1 } });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.unvalidated).toEqual(["gizmo"]);
      expect(result.values.gizmo).toEqual({ whatever: 1 });
    }
  });

  it("combines file + custom unvalidated names in config.fields order", () => {
    registerField("my-widget", Widget);
    const config: FormConfig = {
      id: "t",
      fields: [
        { type: "file", name: "resume" },
        { type: "my-widget", name: "gizmo" } as never,
        { type: "text", name: "firstName", required: true },
      ],
    };
    const result = parseSubmission(config, { firstName: "Ada" });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.unvalidated).toEqual(["resume", "gizmo"]);
  });
});

describe("parseSubmission — otp fail-closed", () => {
  const config: FormConfig = {
    id: "t",
    fields: [{ type: "otp", name: "code", length: 6, required: true }],
  };

  it("rejects with otp_checker_missing when no otpVerified is supplied, never ok:true", () => {
    const result = parseSubmission(config, { code: "123456" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("otp_checker_missing");
      expect(result.errors.fieldErrors?.code).toBe(defaultMessages.otpNotVerified);
      expect(result.errors.formError).toBe(GENERIC_SUBMISSION_ERROR);
    }
  });

  it("is checked independent of parse — even a body that would otherwise fail validation still reports otp_checker_missing", () => {
    const result = parseSubmission(config, {});
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("otp_checker_missing");
  });

  it("does not require a checker when the otp field is not visible", () => {
    const gated: FormConfig = {
      id: "t",
      fields: [
        { type: "text", name: "gate" },
        { type: "otp", name: "code", length: 6, visibleWhen: { field: "gate", equals: "show" } },
      ],
    };
    const result = parseSubmission(gated, { gate: "hide" });
    expect(result.ok).toBe(true);
  });

  it("succeeds when otpVerified confirms the code", () => {
    const result = parseSubmission(config, { code: "123456" }, { otpVerified: () => true });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.values.code).toBe("123456");
  });

  it("uses the SAME generic message whether the checker is missing or returns false (no enumeration oracle)", () => {
    const missing = parseSubmission(config, { code: "123456" });
    const wrong = parseSubmission(config, { code: "123456" }, { otpVerified: () => false });
    expect(missing.ok).toBe(false);
    expect(wrong.ok).toBe(false);
    if (!missing.ok && !wrong.ok) {
      expect(missing.errors.fieldErrors?.code).toBe(wrong.errors.fieldErrors?.code);
    }
  });
});

describe("parseSubmission — validation_failed mapping", () => {
  it("maps a missing required field to fieldErrors keyed by name", () => {
    const result = parseSubmission(baseConfig, { firstName: "", email: "" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("validation_failed");
      expect(result.errors.fieldErrors?.firstName).toBe(defaultMessages.required);
      expect(result.errors.fieldErrors?.email).toBe(defaultMessages.required);
    }
  });

  it("keys a group row issue by its RHF-style dotted path", () => {
    const config: FormConfig = {
      id: "t",
      fields: [{ type: "group", name: "team", fields: [{ type: "text", name: "role", required: true }] }],
    };
    const result = parseSubmission(config, { team: [{ role: "" }] });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("validation_failed");
      expect(result.errors.fieldErrors?.["team.0.role"]).toBe(defaultMessages.required);
    }
  });

  it("keeps the FIRST issue per field when multiple checks fail on the same path", () => {
    const config: FormConfig = {
      id: "t",
      fields: [
        {
          type: "text",
          name: "code",
          required: true,
          rules: { minLength: 5, pattern: "^[a-z]+$", message: "lowercase only" },
        },
      ],
    };
    const result = parseSubmission(config, { code: "AB" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.fieldErrors?.code).toBe(defaultMessages.minLength(5));
  });

  it("never leaks raw zod fields (received/expected/invalid_type) in error messages", () => {
    const result = parseSubmission(baseConfig, { firstName: 42, email: "" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      const text = JSON.stringify(result.errors);
      expect(text).not.toMatch(/"received"/);
      expect(text).not.toMatch(/"expected"/);
      expect(text).not.toMatch(/invalid_type/);
    }
  });

  it("never echoes attacker-submitted input back in an error message", () => {
    const needle = "MALICIOUS_PAYLOAD_MARKER";
    const result = parseSubmission(baseConfig, { firstName: "Ada", email: needle });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.fieldErrors?.email).toBe(defaultMessages.email);
      const text = JSON.stringify(result.errors);
      expect(text).not.toContain(needle);
    }
  });
});

describe("parseSubmission — visibility (fields + steps)", () => {
  it("excludes a condition-hidden field from both validation and output", () => {
    const config: FormConfig = {
      id: "t",
      fields: [
        { type: "text", name: "gate" },
        { type: "text", name: "extra", required: true, visibleWhen: { field: "gate", equals: "show" } },
      ],
    };
    const result = parseSubmission(config, { gate: "hide" });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.values).not.toHaveProperty("extra");
  });

  it("excludes fields owned by a hidden step", () => {
    const config: FormConfig = {
      id: "t",
      fields: [
        { type: "text", name: "gate" },
        { type: "text", name: "extra", required: true },
      ],
      steps: [
        { title: "s1", fieldNames: ["gate"] },
        { title: "s2", fieldNames: ["extra"], visibleWhen: { field: "gate", equals: "show" } },
      ],
    };
    const result = parseSubmission(config, { gate: "hide" });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.values).not.toHaveProperty("extra");
  });
});

describe("parseSubmission — unvalidated is always present", () => {
  it("is an empty array on the happy path with no file/custom fields", () => {
    const result = parseSubmission(baseConfig, { firstName: "Ada", email: "ada@example.com" });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.unvalidated).toEqual([]);
  });

  it("is present on every failure branch", () => {
    const invalidBody = parseSubmission(baseConfig, null);
    const badParse = parseSubmission(baseConfig, { firstName: "", email: "" });
    expect(invalidBody.ok === false && invalidBody.unvalidated).toEqual([]);
    expect(badParse.ok === false && badParse.unvalidated).toEqual([]);
  });

  it("still lists file + custom field names, in config order, on the ok:false branch", () => {
    const Widget = ({ field }: FieldComponentProps) => field.name;
    registerField("my-widget", Widget);
    const config: FormConfig = {
      id: "t",
      fields: [
        { type: "file", name: "resume" },
        { type: "my-widget", name: "gizmo" } as never,
        { type: "text", name: "firstName", required: true },
      ],
    };
    const result = parseSubmission(config, {});
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("validation_failed");
      expect(result.unvalidated).toEqual(["resume", "gizmo"]);
    }
  });
});

const nicknameConfig: FormConfig = {
  id: "nickname-extra",
  fields: [
    { type: "text", name: "nickname" },
    { type: "text", name: "extra", required: true, visibleWhen: { field: "nickname", notEquals: "" } },
  ],
};

const nicknameMatchesConfig: FormConfig = {
  id: "nickname-matches",
  fields: [
    { type: "text", name: "nickname" },
    { type: "text", name: "password", required: true, visibleWhen: { field: "nickname", notEquals: "" } },
    {
      type: "text",
      name: "confirmPassword",
      required: true,
      rules: { matches: "password" },
      visibleWhen: { field: "nickname", notEquals: "" },
    },
  ],
};

type ParityRow = { name: string; config: FormConfig; input: FormValues; otp?: OtpVerifiedChecker };

const CORPUS: ParityRow[] = [
  { name: "multiStepSignup (untouched)", config: multiStepSignupConfig, input: {}, otp: () => true },
  {
    name: "multiStepSignup (populated)",
    config: multiStepSignupConfig,
    input: {
      fullName: "Ada Lovelace",
      email: "ada@example.com",
      password: "Secret123",
      confirmPassword: "Secret123",
      emailOtp: "123456",
    },
    otp: () => true,
  },
  { name: "conditionalProfile (untouched)", config: conditionalProfileConfig, input: {} },
  {
    name: "conditionalProfile (populated)",
    config: conditionalProfileConfig,
    input: { accountType: "individual", plan: "pro", billingCycle: "annual", country: "NL", phone: "+31612345678" },
  },
  { name: "advancedFields (untouched)", config: advancedFieldsConfig, input: {} },
  {
    name: "advancedFields (populated)",
    config: advancedFieldsConfig,
    input: {
      cardNumber: "4111222233334444",
      startDate: "1970-01-01",
      endDate: "1970-01-02",
      startTime: "23:00",
      endTime: "23:30",
      volume: 40,
    },
  },
  {
    name: "advancedFields (populated, sibling bounds violated)",
    config: advancedFieldsConfig,
    input: {
      cardNumber: "4111222233334444",
      startDate: "1970-01-02",
      endDate: "1970-01-01",
      startTime: "23:30",
      endTime: "23:00",
      volume: 40,
    },
  },
  { name: "nickname/extra (untouched)", config: nicknameConfig, input: {} },
  {
    name: "nickname/extra (nickname set, extra omitted)",
    config: nicknameConfig,
    input: { nickname: "Ada" },
  },
  { name: "nickname-matches (untouched)", config: nicknameMatchesConfig, input: {} },
  {
    name: "nickname-matches (populated, matching)",
    config: nicknameMatchesConfig,
    input: { nickname: "Ada", password: "Secret1", confirmPassword: "Secret1" },
  },
  {
    name: "nickname-matches (populated, mismatched)",
    config: nicknameMatchesConfig,
    input: { nickname: "Ada", password: "Secret1", confirmPassword: "Nope1" },
  },
];

const TRANSPORTS: Record<string, (value: unknown) => unknown> = {
  json: (value) => JSON.parse(JSON.stringify(value)),
  direct: (value) => value,
};

describe("parseSubmission — client/server parity matrix (regression guard against client/server drift)", () => {
  for (const { name, config, input, otp } of CORPUS) {
    for (const [transport, apply] of Object.entries(TRANSPORTS)) {
      it(`${name} via ${transport}`, () => {
        const clientValues = { ...buildDefaultValues(config.fields), ...input } as FormValues;
        const clientResult = buildResolverSchema(config, defaultMessages, otp, clientValues).safeParse(clientValues);
        const wireBody = apply(clientResult.success ? clientResult.data : clientValues);
        const server = parseSubmission(config, wireBody, { otpVerified: otp });

        expect(server.ok).toBe(clientResult.success);

        if (clientResult.success && server.ok) {
          expect(server.values).toEqual(apply(clientResult.data));
        } else if (!clientResult.success && !server.ok) {
          expect(server.code).toBe("validation_failed");
          const clientKeys = [
            ...new Set(
              clientResult.error.issues.filter((issue) => issue.path.length > 0).map((issue) => issue.path.join(".")),
            ),
          ].sort();
          const serverKeys = Object.keys(server.errors.fieldErrors ?? {}).sort();
          expect(serverKeys).toEqual(clientKeys);
        }
      });
    }
  }
});

describe("parseSubmission -> applyServerErrors round-trip", () => {
  it("lands validation_failed field errors on the correct RHF fields, including a group-row path", () => {
    const config: FormConfig = {
      id: "t",
      fields: [
        { type: "text", name: "firstName", required: true },
        { type: "group", name: "team", fields: [{ type: "text", name: "role", required: true }] },
      ],
    };
    const result = parseSubmission(config, { firstName: "", team: [{ role: "" }] });
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected validation_failed");

    const setError = vi.fn();
    const outcome = applyServerErrors(setError, result.errors, config.fields);

    expect(setError).toHaveBeenCalledWith("firstName", {
      type: "server",
      message: result.errors.fieldErrors?.firstName,
    });
    expect(setError).toHaveBeenCalledWith("team.0.role", {
      type: "server",
      message: result.errors.fieldErrors?.["team.0.role"],
    });
    expect(outcome.applied).toEqual(["firstName", "team.0.role"]);
    expect(outcome.formError).toBeUndefined();
  });
});

describe("parseSubmission — group-row conditions inherit the known v1 limitation", () => {
  it("still requires a row's condition-gated field even though the row's own condition says it should be hidden", () => {
    const config: FormConfig = {
      id: "t",
      fields: [
        {
          type: "group",
          name: "team",
          min: 1,
          fields: [
            { type: "checkbox", name: "hasRole" },
            { type: "text", name: "role", required: true, visibleWhen: { field: "hasRole", equals: true } },
          ],
        },
      ],
    };
    const result = parseSubmission(config, { team: [{ hasRole: false }] });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("validation_failed");
      expect(result.errors.fieldErrors?.["team.0.role"]).toBe(defaultMessages.required);
    }
  });
});

describe("parseSubmission — optionsFrom branch membership (blank source allows nothing)", () => {
  it("rejects a select value when its optionsFrom source is blank/absent, even if the value is a member of SOME branch", () => {
    const config: FormConfig = {
      id: "t",
      fields: [
        { type: "select", name: "plan", options: [{ label: "Free", value: "free" }, { label: "Pro", value: "pro" }] },
        {
          type: "select",
          name: "billingCycle",
          optionsFrom: { field: "plan", map: { pro: [{ label: "Monthly", value: "monthly" }] } },
        },
      ],
    };
    const result = parseSubmission(config, { billingCycle: "monthly" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("validation_failed");
      expect(result.errors.fieldErrors?.billingCycle).toBe(defaultMessages.invalidOption);
    }
  });
});

describe("parseSubmission — cross-field rules fire server-side", () => {
  it("rules.matches: rejects a confirmPassword that doesn't match password, with the configured matchesMessage", () => {
    const result = parseSubmission(
      multiStepSignupConfig,
      {
        fullName: "Ada Lovelace",
        email: "ada@example.com",
        password: "Secret123",
        confirmPassword: "Nope123",
        emailOtp: "123456",
      },
      { otpVerified: () => true },
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("validation_failed");
      expect(result.errors.fieldErrors?.confirmPassword).toBe("Passwords don't match");
    }
  });

  it("minDateField: rejects an end date before its sibling start date", () => {
    const config: FormConfig = {
      id: "t",
      fields: [
        { type: "date", name: "start", required: true },
        { type: "date", name: "end", required: true, minDateField: "start" },
      ],
    };
    const result = parseSubmission(config, { start: "2026-07-19", end: "2026-07-18" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("validation_failed");
      expect(result.errors.fieldErrors?.end).toBe(defaultMessages.dateAfter("start"));
    }
  });

  it("minTimeField: rejects an end time before its sibling start time", () => {
    const config: FormConfig = {
      id: "t",
      fields: [
        { type: "time", name: "start", required: true },
        { type: "time", name: "end", required: true, minTimeField: "start" },
      ],
    };
    const result = parseSubmission(config, { start: "10:00", end: "09:00" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("validation_failed");
      expect(result.errors.fieldErrors?.end).toBe(defaultMessages.timeAfter("start"));
    }
  });
});

describe("parseSubmission — attacker-controlled condition sources", () => {
  it("documents that flipping a REGULAR (untrusted) condition source to hide a required field is acceptable, not a bypass — the server reaches the identical conclusion the client would from the identical value", () => {
    const config: FormConfig = {
      id: "t",
      fields: [
        {
          type: "select",
          name: "accountType",
          required: true,
          options: [
            { label: "Individual", value: "individual" },
            { label: "Company", value: "company" },
          ],
        },
        {
          type: "text",
          name: "companyName",
          required: true,
          visibleWhen: { field: "accountType", equals: "company" },
        },
      ],
    };
    const values = { accountType: "individual" };
    const clientParsed = buildResolverSchema(config, defaultMessages, undefined, values).parse(values);

    const server = parseSubmission(config, values);
    expect(server.ok).toBe(true);
    if (server.ok) {
      expect(server.values).not.toHaveProperty("companyName");
      expect(server.values).toEqual(clientParsed);
    }
  });

  it("a tampered hidden-field visibleWhen SOURCE cannot un-hide/un-require the gated field — the config's constant wins even when the attacker's value would otherwise flip the condition to NOT match", () => {
    const config: FormConfig = {
      id: "t",
      fields: [
        { type: "hidden", name: "source", value: "campaign-x" },
        {
          type: "text",
          name: "promoCode",
          required: true,
          visibleWhen: { field: "source", equals: "campaign-x" },
        },
      ],
    };
    const result = parseSubmission(config, { source: "not-campaign-x" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("validation_failed");
      expect(result.errors.fieldErrors?.promoCode).toBe(defaultMessages.required);
      expect(result.errors.fieldErrors?.source).toBeUndefined();
    }
  });
});

describe("parseSubmission — otp enumeration & dual-error placement", () => {
  const config: FormConfig = {
    id: "t",
    fields: [{ type: "otp", name: "code", length: 6, required: true }],
  };

  it("produces byte-identical field messages for two different rejection reasons behind the SAME checker (no enumeration oracle)", () => {
    const noRecord = parseSubmission(config, { code: "000000" }, { otpVerified: () => false });
    const wrongCode = parseSubmission(config, { code: "123456" }, { otpVerified: () => false });
    expect(noRecord.ok).toBe(false);
    expect(wrongCode.ok).toBe(false);
    if (!noRecord.ok && !wrongCode.ok) {
      expect(noRecord.code).toBe(wrongCode.code);
      expect(noRecord.errors.fieldErrors?.code).toBe(wrongCode.errors.fieldErrors?.code);
    }
  });

  it("otp_checker_missing: dual placement resolved — fieldErrors[otpField] carries the actionable message, formError carries the SAME uniform generic copy every other non-validation_failed branch uses (staff-engineer ruling on MAJOR 3)", () => {
    const result = parseSubmission(config, { code: "123456" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("otp_checker_missing");
      expect(result.errors.fieldErrors?.code).toBe(defaultMessages.otpNotVerified);
      expect(result.errors.formError).toBe(GENERIC_SUBMISSION_ERROR);
      expect(result.errors.formError).not.toBe(result.errors.fieldErrors?.code);
    }
  });
});

describe("parseSubmission — formError uniformity across non-validation_failed branches (MAJOR 3 security property)", () => {
  const groupOtpConfig: FormConfig = {
    id: "t",
    fields: [{ type: "group", name: "team", fields: [{ type: "otp", name: "code", length: 6 }] }],
  };
  const otpConfig: FormConfig = {
    id: "t",
    fields: [{ type: "otp", name: "code", length: 6, required: true }],
  };

  it("returns byte-identical formError across invalid_body, otp_in_group, input_too_large, and otp_checker_missing", () => {
    const results = [
      parseSubmission(baseConfig, "nope"),
      parseSubmission(groupOtpConfig, { team: [{ code: "123456" }] }),
      parseSubmission(baseConfig, { firstName: "x".repeat(11), email: "a@b.com" }, { maxStringLength: 10 }),
      parseSubmission(otpConfig, { code: "123456" }),
    ];
    for (const result of results) {
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.errors.formError).toBe(GENERIC_SUBMISSION_ERROR);
    }
  });
});

// ---------------------------------------------------------------------------
// BUG 1 (HIGH, RED): reinjectHiddenFields (parseSubmission.ts:62-70) and the
// post-parse re-assert loop (parseSubmission.ts:167-171) both iterate
// config.fields only — neither recurses into group.fields. A group-nested
// hidden field's value is therefore trusted straight from the request body.
//
// The staff-engineer-approved fix is per-row recursion over the SUBMITTED
// array (indexed by arrival position, arbitrary depth), never coercing
// non-object rows/non-array group values. These tests pin that target
// behavior; several are expected to fail today because no group recursion
// happens at all.
// ---------------------------------------------------------------------------
describe("parseSubmission — group-nested hidden fields (BUG 1: reinjectHiddenFields does not recurse into groups)", () => {
  const config: FormConfig = {
    id: "t",
    fields: [
      { type: "hidden", name: "topPrice", value: 100 },
      {
        type: "group",
        name: "items",
        fields: [
          { type: "number", name: "qty", required: true },
          { type: "hidden", name: "price", value: 100 },
        ],
      },
    ],
  };

  it("injects the per-row hidden value into every submitted row, indexed by arrival order, without adding/removing/reordering rows (also regression-pins the existing top-level re-injection)", () => {
    const result = parseSubmission(config, {
      topPrice: 0,
      items: [
        { qty: 1, price: 0 },
        { qty: 2, price: 999 },
      ],
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      // Regression pin: top-level hidden re-injection already works and must
      // keep working after any shared-recursion refactor.
      expect(result.values.topPrice).toBe(100);
      // The bug: today these come back as { qty: 1, price: 0 } / { qty: 2, price: 999 }.
      expect(result.values.items).toEqual([
        { qty: 1, price: 100 },
        { qty: 2, price: 100 },
      ]);
    }
  });

  // Load-bearing: every other test in this block observes `result.values`,
  // which is the POST-reassert output — reassertHiddenFields is guarded by
  // `field.name in asserted` and can only overwrite a key that's already
  // present, never add one that's absent. Those tests would therefore still
  // pass even if reinjectHiddenFields never learned to recurse into groups
  // at all (reassert alone would happily paper over it whenever the row
  // already has the key). This sparse-row case is the one that isolates
  // injection from re-assert, because `price` is absent from the row and
  // only reinjectHiddenFields's own recursion can put it there. Don't merge
  // this into the test above — doing so would silently lose the only case
  // that actually exercises reinjectHiddenFields's recursion.
  it("injects the hidden value even when the key is entirely absent from a sparse row (most-likely-missed case)", () => {
    const result = parseSubmission(config, { items: [{ qty: 1 }] });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.values.items).toEqual([{ qty: 1, price: 100 }]);
    }
  });

  it("injects hidden values at arbitrary depth — two levels of nested groups", () => {
    const nestedConfig: FormConfig = {
      id: "t",
      fields: [
        {
          type: "group",
          name: "outer",
          fields: [
            { type: "text", name: "label", required: true },
            {
              type: "group",
              name: "inner",
              fields: [
                { type: "text", name: "code", required: true },
                { type: "hidden", name: "secret", value: "server-secret" },
              ],
            },
          ],
        },
      ],
    };
    const result = parseSubmission(nestedConfig, {
      outer: [{ label: "row-a", inner: [{ code: "x1", secret: "attacker-value" }] }],
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.values.outer).toEqual([
        { label: "row-a", inner: [{ code: "x1", secret: "server-secret" }] },
      ]);
    }
  });

  it("leaves non-object rows and non-array group values untouched — no coercion to {}, the row schema rejects them on its own (forward-looking invariant, not a bug pin: nothing coerces today either since groups aren't recursed into at all)", () => {
    const stringGroup = parseSubmission(config, { items: "not-an-array" });
    expect(stringGroup.ok).toBe(false);
    if (!stringGroup.ok) expect(stringGroup.code).toBe("validation_failed");

    expect(() => parseSubmission(config, { items: [null] })).not.toThrow();
    const nullRow = parseSubmission(config, { items: [null] });
    expect(nullRow.ok).toBe(false);

    expect(() => parseSubmission(config, { items: [["nested-array-row"]] })).not.toThrow();
    const arrayRow = parseSubmission(config, { items: [["nested-array-row"]] });
    expect(arrayRow.ok).toBe(false);
  });

  it("still injects rows beyond the group's max, then lets zod reject the oversized array — no ok:true leak (black-box: indistinguishable from today's already-correct max enforcement)", () => {
    const cappedConfig: FormConfig = {
      id: "t",
      fields: [
        {
          type: "group",
          name: "items",
          max: 1,
          fields: [
            { type: "number", name: "qty", required: true },
            { type: "hidden", name: "price", value: 100 },
          ],
        },
      ],
    };
    const result = parseSubmission(cappedConfig, { items: [{ qty: 1 }, { qty: 2 }] });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("validation_failed");
      expect(result.errors.fieldErrors?.items).toBe(defaultMessages.max(1));
    }
  });
});

// ---------------------------------------------------------------------------
// Hidden field values are aliased BY REFERENCE from the module-level
// FormConfig into every row (and across requests) unless cloned. Pins the
// structuredClone fix in reinjectHiddenFields/reassertHiddenFields: a
// mutation on a returned row's hidden object must not leak into the config
// object itself, into a sibling row, or into the next parseSubmission call.
// ---------------------------------------------------------------------------
describe("parseSubmission — hidden field values are cloned, not aliased by reference", () => {
  const topMetaValue = { role: "admin" };
  const rowMetaValue = { tier: "gold" };
  const config: FormConfig = {
    id: "t",
    fields: [
      { type: "hidden", name: "topMeta", value: topMetaValue },
      {
        type: "group",
        name: "items",
        fields: [
          { type: "number", name: "qty", required: true },
          { type: "hidden", name: "rowMeta", value: rowMetaValue },
        ],
      },
    ],
  };

  it("returns distinct clones per row/request; mutating a returned value never affects the config or a later call", () => {
    const first = parseSubmission(config, {
      topMeta: {},
      items: [
        { qty: 1, rowMeta: {} },
        { qty: 2, rowMeta: {} },
      ],
    });
    expect(first.ok).toBe(true);
    if (!first.ok) return;

    expect(first.values.topMeta).toEqual(topMetaValue);
    expect(first.values.topMeta).not.toBe(topMetaValue);

    const rows = first.values.items as Array<Record<string, unknown>>;
    expect(rows[0].rowMeta).toEqual(rowMetaValue);
    expect(rows[0].rowMeta).not.toBe(rowMetaValue);
    // Each row must get its own clone, not share one object across rows.
    expect(rows[0].rowMeta).not.toBe(rows[1].rowMeta);

    // Mutate the returned values the way a careless host integration might.
    (first.values.topMeta as Record<string, unknown>).role = "hacked";
    rows[0].rowMeta = { tampered: true };

    const second = parseSubmission(config, { topMeta: {}, items: [{ qty: 1, rowMeta: {} }] });
    expect(second.ok).toBe(true);
    if (!second.ok) return;
    expect(second.values.topMeta).toEqual({ role: "admin" });
    expect((second.values.items as Array<Record<string, unknown>>)[0].rowMeta).toEqual({ tier: "gold" });

    // The module-level config values themselves must be untouched too.
    expect(topMetaValue).toEqual({ role: "admin" });
    expect(rowMetaValue).toEqual({ tier: "gold" });
  });
});

// ---------------------------------------------------------------------------
// BUG 2 (MEDIUM, RED): exceedsMaxStringLength (parseSubmission.ts:72-77)
// recurses through body-controlled arrays/objects with no depth cap. A
// deeply-nested body blows the call stack with an uncaught RangeError
// instead of parseSubmission returning ok:false. Per AGENTS.md, throwing is
// reserved for malformed CONFIG — a bad BODY must always return ok:false.
// ---------------------------------------------------------------------------
describe("parseSubmission — unbounded recursion in exceedsMaxStringLength (BUG 2: uncaught RangeError on deeply-nested body)", () => {
  function buildDeeplyNestedArray(depth: number): unknown {
    let value: unknown = "leaf";
    for (let i = 0; i < depth; i++) value = [value];
    return value;
  }

  it("returns ok:false with an input-too-large-style code for a ~50,000-deep nested array body, never throwing a RangeError", () => {
    const deepBody = { firstName: "Ada", email: "ada@example.com", nested: buildDeeplyNestedArray(50_000) };
    let result: ReturnType<typeof parseSubmission> | undefined;
    expect(() => {
      result = parseSubmission(baseConfig, deepBody);
    }).not.toThrow();
    expect(result?.ok).toBe(false);
    if (result && !result.ok) {
      expect(result.code).toBe("input_too_large");
    }
  });

  // Boundary-precise pins: the only existing coverage is ~50,000 (way over)
  // and a couple of levels of nested groups (way under) — nothing near
  // MAX_STRING_LENGTH_CHECK_DEPTH (32) itself, so a typo that changed 32 to
  // e.g. 3200 would sail through the rest of this file undetected.
  it("accepts a body nested exactly 31 levels deep — one under the depth cap", () => {
    const deepBody = { firstName: "Ada", email: "ada@example.com", nested: buildDeeplyNestedArray(31) };
    const result = parseSubmission(baseConfig, deepBody);
    expect(result.ok).toBe(true);
  });

  it("rejects a body nested 33 levels deep with input_too_large — two over the depth cap", () => {
    const deepBody = { firstName: "Ada", email: "ada@example.com", nested: buildDeeplyNestedArray(33) };
    const result = parseSubmission(baseConfig, deepBody);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("input_too_large");
  });

  it("still parses a legitimately-nested-but-reasonable body (a few levels of nested groups) — the depth cap must not break real submissions", () => {
    const reasonableConfig: FormConfig = {
      id: "t",
      fields: [
        {
          type: "group",
          name: "level1",
          fields: [
            { type: "group", name: "level2", fields: [{ type: "text", name: "value", required: true }] },
          ],
        },
      ],
    };
    const result = parseSubmission(reasonableConfig, { level1: [{ level2: [{ value: "ok" }] }] });
    expect(result.ok).toBe(true);
  });
});
