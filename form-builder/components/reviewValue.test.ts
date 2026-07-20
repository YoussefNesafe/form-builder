import { describe, expect, it } from "vitest";
import { defaultMessages } from "../core/messages";
import type { AnyFieldConfig } from "../core/types";
import { formatReviewValue, type ReviewValueContext } from "./reviewValue";

const ctx: ReviewValueContext = { messages: defaultMessages };

describe("formatReviewValue", () => {
  it("blank values show the not-answered marker", () => {
    expect(formatReviewValue({ type: "text", name: "a" }, "", ctx)).toBe(defaultMessages.notAnswered);
    expect(formatReviewValue({ type: "select", name: "a", options: [] }, undefined, ctx)).toBe(
      defaultMessages.notAnswered,
    );
    expect(formatReviewValue({ type: "checkbox", name: "a", options: [{ label: "A", value: "a" }] }, [], ctx)).toBe(
      defaultMessages.notAnswered,
    );
  });

  it("selects and radios show option labels; multiples join", () => {
    const options = [
      { label: "Red", value: "red" },
      { label: "Blue", value: "blue" },
    ];
    expect(formatReviewValue({ type: "select", name: "c", options }, "red", ctx)).toBe("Red");
    expect(formatReviewValue({ type: "select", name: "c", options, multiple: true }, ["red", "blue"], ctx)).toBe(
      "Red, Blue",
    );
    expect(formatReviewValue({ type: "radio", name: "c", options }, "blue", ctx)).toBe("Blue");
  });

  it("optionsFrom selects resolve labels across all branches", () => {
    const field: AnyFieldConfig = {
      type: "select",
      name: "city",
      optionsFrom: { field: "country", map: { US: [{ label: "New York", value: "nyc" }] } },
    };
    expect(formatReviewValue(field, "nyc", ctx)).toBe("New York");
  });

  it("booleans read yes/no; checkbox groups use labels", () => {
    expect(formatReviewValue({ type: "switch", name: "s" }, true, ctx)).toBe(defaultMessages.yes);
    expect(formatReviewValue({ type: "checkbox", name: "c" }, false, ctx)).toBe(defaultMessages.no);
    expect(
      formatReviewValue({ type: "checkbox", name: "c", options: [{ label: "News", value: "news" }] }, ["news"], ctx),
    ).toBe("News");
  });

  it("masked values re-format for display; passwords mask; otp is three-state", () => {
    expect(formatReviewValue({ type: "masked", name: "card", mask: "## ##" }, "1234", ctx)).toBe("12 34");
    expect(formatReviewValue({ type: "password", name: "p" }, "hunter2", ctx)).toBe("••••••");
    expect(formatReviewValue({ type: "otp", name: "code", length: 6 }, "", ctx)).toBe(
      defaultMessages.notAnswered,
    );
    expect(formatReviewValue({ type: "otp", name: "code", length: 6 }, "123456", ctx)).toBe(
      defaultMessages.otpNotVerified,
    );
    expect(
      formatReviewValue({ type: "otp", name: "code", length: 6 }, "123456", {
        ...ctx,
        verifiedFields: new Set(["code"]),
      }),
    ).toBe(defaultMessages.otpVerified);
  });

  it("signatures never leak the data URL as text", () => {
    const dataUrl = `data:image/png;base64,${"A".repeat(5000)}`;
    expect(formatReviewValue({ type: "signature", name: "sig" }, dataUrl, ctx)).toBe(defaultMessages.signed);
    expect(formatReviewValue({ type: "signature", name: "sig" }, "", ctx)).toBe(defaultMessages.notAnswered);
  });

  it("country resolves host labels first, then Intl, then the code", () => {
    expect(
      formatReviewValue({ type: "country", name: "c" }, "AE", { ...ctx, locale: { countryLabels: { AE: "الإمارات" } } }),
    ).toBe("الإمارات");
    expect(formatReviewValue({ type: "country", name: "c" }, "DE", ctx)).toBe(
      new Intl.DisplayNames(undefined, { type: "region" }).of("DE"),
    );
  });

  it("date ranges join from/to; files show names", () => {
    expect(
      formatReviewValue({ type: "date", name: "d", range: true }, { from: "2026-07-01", to: "2026-07-11" }, ctx),
    ).toBe("2026-07-01 – 2026-07-11");
    expect(formatReviewValue({ type: "file", name: "f" }, new File(["x"], "cv.pdf"), ctx)).toBe("cv.pdf");
  });

  it("custom types use the host formatter, else String()", () => {
    const field: AnyFieldConfig = { type: "richText", name: "bio" };
    expect(formatReviewValue(field, { blocks: 3 }, ctx)).toBe("[object Object]");
    expect(
      formatReviewValue(field, { blocks: 3 }, { ...ctx, reviewFormatters: { richText: (v) => `${(v as { blocks: number }).blocks} blocks` } }),
    ).toBe("3 blocks");
  });
});
