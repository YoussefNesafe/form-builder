import { describe, expect, it } from "vitest";
import { fieldWidthClass } from "./variants";

const classes = (value: string) => value.split(/\s+/).filter(Boolean).sort();

describe("fieldWidthClass", () => {
  it("defaults to full width at every breakpoint", () =>
    expect(classes(fieldWidthClass())).toEqual(
      classes("col-span-12 tablet:col-span-12 desktop:col-span-12"),
    ));

  it("applies a plain value to every breakpoint", () =>
    expect(classes(fieldWidthClass("half"))).toEqual(
      classes("col-span-6 tablet:col-span-6 desktop:col-span-6"),
    ));

  it("maps third and quarter to their 12-column spans", () => {
    expect(classes(fieldWidthClass("third"))).toEqual(
      classes("col-span-4 tablet:col-span-4 desktop:col-span-4"),
    );
    expect(classes(fieldWidthClass("quarter"))).toEqual(
      classes("col-span-3 tablet:col-span-3 desktop:col-span-3"),
    );
  });

  it("sets breakpoints independently, unset falls back to full", () =>
    expect(classes(fieldWidthClass({ tablet: "half" }))).toEqual(
      classes("col-span-12 tablet:col-span-6 desktop:col-span-12"),
    ));

  it("supports mixed values per breakpoint", () =>
    expect(classes(fieldWidthClass({ mobile: "half", tablet: "third", desktop: "quarter" }))).toEqual(
      classes("col-span-6 tablet:col-span-4 desktop:col-span-3"),
    ));
});
