import { describe, expect, it } from "vitest";
import { fieldWidthClass } from "./variants";

const classes = (value: string) => value.split(/\s+/).filter(Boolean).sort();

describe("fieldWidthClass", () => {
  it("defaults to full width at every breakpoint", () =>
    expect(classes(fieldWidthClass())).toEqual(
      classes("col-span-4 tablet:col-span-4 desktop:col-span-4"),
    ));

  it("applies a plain value to every breakpoint", () =>
    expect(classes(fieldWidthClass("half"))).toEqual(
      classes("col-span-2 tablet:col-span-2 desktop:col-span-2"),
    ));

  it("sets breakpoints independently, unset falls back to full", () =>
    expect(classes(fieldWidthClass({ tablet: "half" }))).toEqual(
      classes("col-span-4 tablet:col-span-2 desktop:col-span-4"),
    ));

  it("supports full override per breakpoint", () =>
    expect(classes(fieldWidthClass({ mobile: "half", desktop: "half" }))).toEqual(
      classes("col-span-2 tablet:col-span-4 desktop:col-span-2"),
    ));
});
