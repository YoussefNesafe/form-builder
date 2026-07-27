// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { FormProvider, useForm, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { defaultMessages } from "../core/messages";
import { FieldRuntimeContext } from "../components/FieldRuntime";
import { buildFormSchema } from "../core/validation";
import type { FieldConfig } from "../core/types";
import { DateField } from "./DateField";

type DateConfig = Extract<FieldConfig, { type: "date" }>;

function Harness({
  field,
  defaultValues,
  onForm,
}: {
  field: DateConfig;
  defaultValues: Record<string, unknown>;
  onForm: (form: UseFormReturn) => void;
}) {
  const form = useForm({
    defaultValues,
    mode: "onChange",
    resolver: zodResolver(buildFormSchema({ id: "t", fields: [field] }, defaultMessages)),
  });
  onForm(form);
  return (
    <FormProvider {...form}>
      <FieldRuntimeContext.Provider value={{ disabled: false, messages: defaultMessages }}>
        <DateField field={field} />
      </FieldRuntimeContext.Provider>
    </FormProvider>
  );
}

function setup(field: DateConfig, defaultValues: Record<string, unknown> = { [field.name]: undefined }) {
  let form!: UseFormReturn;
  render(<Harness field={field} defaultValues={defaultValues} onForm={(f) => (form = f)} />);
  return () => form;
}

/** Opens the popover; the calendar is not mounted until then. */
function openCalendar(label = "Date of birth") {
  fireEvent.click(screen.getByRole("button", { name: new RegExp(label) }));
}

/**
 * The gridcell for an ISO day. react-day-picker puts `data-day="yyyy-MM-dd"` on
 * the `<td>` (the day *button* carries a locale-formatted one), so this is the
 * one locale-proof handle on a specific day.
 */
function cell(iso: string): HTMLElement {
  const found = document.querySelector<HTMLElement>(`td[data-day="${iso}"]`);
  if (!found) throw new Error(`no day cell for ${iso}`);
  return found;
}

function dayButton(iso: string): HTMLButtonElement {
  const button = cell(iso).querySelector("button");
  if (!button) throw new Error(`day ${iso} renders no button`);
  return button;
}

function yearSelect(): HTMLSelectElement {
  return screen.getByRole("combobox", { name: /Year/i }) as HTMLSelectElement;
}

function yearOptions(): string[] {
  return Array.from(yearSelect().querySelectorAll("option")).map((o) => o.textContent ?? "");
}

// A DOB cutoff: born on or before this date and you are 18. Fixed rather than
// derived from today so the calendar's month never drifts under the tests.
const CUTOFF = "2008-07-27";
const TOO_YOUNG = "2008-07-28";
const UNDER_18 = "You must be 18 or older to open an account.";

const dob: DateConfig = {
  type: "date",
  name: "dob",
  label: "Date of birth",
  maxDate: CUTOFF,
  message: UNDER_18,
};

describe("DateField picker bounds", () => {
  afterEach(cleanup);

  describe("by default the bounds restrict the picker", () => {
    it("disables days outside minDate/maxDate", () => {
      setup(dob);
      openCalendar();
      expect(cell(CUTOFF).getAttribute("data-disabled")).toBeNull();
      expect(cell(TOO_YOUNG).getAttribute("data-disabled")).toBe("true");
      expect(dayButton(TOO_YOUNG).disabled).toBe(true);
    });

    it("disables days before minDate too", () => {
      setup({ type: "date", name: "dob", label: "Date of birth", minDate: "2008-07-10", maxDate: "2008-07-20" });
      openCalendar();
      expect(cell("2008-07-09").getAttribute("data-disabled")).toBe("true");
      expect(cell("2008-07-10").getAttribute("data-disabled")).toBeNull();
    });

    it("clamps the year dropdown to the bounds", () => {
      setup({ ...dob, minDate: "2006-01-01" });
      openCalendar();
      expect(yearOptions()).toEqual(["2006", "2007", "2008"]);
    });

    it("keeps an out-of-range day out of arrow-key reach", () => {
      setup(dob);
      openCalendar();
      const last = dayButton(CUTOFF);
      act(() => last.focus());
      fireEvent.keyDown(last, { key: "ArrowRight" });
      // Every later day in the month is disabled, so focus has nowhere to go.
      expect(document.activeElement).toBe(last);
    });

    it("ignores an out-of-range click", () => {
      const form = setup(dob);
      openCalendar();
      fireEvent.click(dayButton(TOO_YOUNG));
      expect(form().getValues("dob")).toBeUndefined();
    });
  });

  describe('pickerBounds: "validate" lets the bounds validate instead of restrict', () => {
    const open: DateConfig = { ...dob, pickerBounds: "validate" };

    it("leaves out-of-range days selectable", () => {
      setup(open);
      openCalendar();
      expect(cell(TOO_YOUNG).getAttribute("data-disabled")).toBeNull();
      expect(dayButton(TOO_YOUNG).disabled).toBe(false);
    });

    it("picking an out-of-range day stores it and reports the field's message", async () => {
      const form = setup(open);
      openCalendar();
      await act(async () => {
        fireEvent.click(dayButton(TOO_YOUNG));
      });
      expect(form().getValues("dob")).toBe(TOO_YOUNG);
      expect(screen.getByText(UNDER_18)).toBeTruthy();
    });

    it("falls back to the generic bound message when the field sets none", async () => {
      const form = setup({ type: "date", name: "dob", label: "Date of birth", maxDate: CUTOFF, pickerBounds: "validate" });
      openCalendar();
      await act(async () => {
        fireEvent.click(dayButton(TOO_YOUNG));
      });
      expect(form().getValues("dob")).toBe(TOO_YOUNG);
      expect(screen.getByText(defaultMessages.max(CUTOFF))).toBeTruthy();
    });

    it("still accepts an in-range day", async () => {
      const form = setup(open);
      openCalendar();
      await act(async () => {
        fireEvent.click(dayButton(CUTOFF));
      });
      expect(form().getValues("dob")).toBe(CUTOFF);
      expect(screen.queryByText(UNDER_18)).toBeNull();
    });

    it("unclamps the year dropdown at both ends, so a birth year past either bound is reachable", () => {
      setup({ ...open, minDate: "2006-01-01" });
      openCalendar();
      const years = yearOptions();
      // Past maxDate — the 16-year-old who has to reach their birth year.
      expect(years).toContain("2010");
      expect(years).toContain(String(new Date().getFullYear()));
      // Before minDate — the same clamp applies at the other end.
      expect(years).toContain("2005");
      expect(years).toContain(String(new Date().getFullYear() - 50));
    });

    it("still opens on the maxDate month, which points at the rule without hiding anything", () => {
      setup(open);
      openCalendar();
      // July 2008 — so the days that break the rule are one hop away.
      expect(yearSelect().value).toBe("2008");
      expect(document.querySelector(`td[data-day="${TOO_YOUNG}"]`)).toBeTruthy();
    });

    it("widens the navigable window to a bound outside it rather than replacing it", () => {
      // The fallback window is now-100y..now+10y. A bound beyond it has to widen
      // that window, not substitute for it: every date between the bound and the
      // window edge is schema-valid, so the mode whose whole job is making
      // out-of-range dates reachable must not be what hides in-range ones.
      setup({ type: "date", name: "dob", label: "Date of birth", minDate: "1890-01-01", pickerBounds: "validate" });
      openCalendar();
      const years = yearOptions();
      expect(years).toContain("1890");
      expect(years).toContain("1900");
      expect(years).toContain(String(new Date().getFullYear()));
    });

    it("widens it at the far end too", () => {
      setup({ type: "date", name: "eol", label: "Date of birth", maxDate: "2060-06-30", pickerBounds: "validate" });
      openCalendar();
      const years = yearOptions();
      expect(years).toContain("2060");
      expect(years).toContain(String(new Date().getFullYear()));
    });

    it("reaches a lone minDate that sits past the far edge", () => {
      // A bound counts at whichever end it falls, not the end it is named for.
      // With only a future minDate, every selectable date in the generic span
      // is one the schema rejects, so the span has to reach the bound.
      setup({ type: "date", name: "start", label: "Date of birth", minDate: "2050-01-01", pickerBounds: "validate" });
      openCalendar();
      expect(yearOptions()).toContain("2050");
    });

    it("reaches a lone maxDate that sits before the near edge", () => {
      setup({ type: "date", name: "dob", label: "Date of birth", maxDate: "1850-12-31", pickerBounds: "validate" });
      openCalendar();
      expect(yearOptions()).toContain("1850");
    });

    it("puts an out-of-range day in arrow-key reach, enabled and activatable", async () => {
      const form = setup(open);
      openCalendar();
      const last = dayButton(CUTOFF);
      act(() => last.focus());
      fireEvent.keyDown(last, { key: "ArrowRight" });

      const focused = document.activeElement as HTMLButtonElement;
      expect(focused).toBe(dayButton(TOO_YOUNG));
      // A native <button> that is neither disabled nor aria-disabled: Enter and
      // Space activate it. jsdom does not synthesise that click, so fire it on
      // the element the keyboard actually focused.
      expect(focused.tagName).toBe("BUTTON");
      expect(focused.disabled).toBe(false);
      expect(focused.getAttribute("aria-disabled")).toBeNull();
      await act(async () => {
        fireEvent.click(focused);
      });
      expect(form().getValues("dob")).toBe(TOO_YOUNG);
      expect(screen.getByText(UNDER_18)).toBeTruthy();
    });

    it("applies to range calendars too", () => {
      setup(
        { type: "date", name: "stay", label: "Stay", range: true, maxDate: CUTOFF, pickerBounds: "validate" },
        { stay: undefined },
      );
      openCalendar("Stay");
      expect(dayButton(TOO_YOUNG).disabled).toBe(false);
    });

    it("leaves a range calendar restricted by default", () => {
      setup({ type: "date", name: "stay", label: "Stay", range: true, maxDate: CUTOFF }, { stay: undefined });
      openCalendar("Stay");
      expect(dayButton(TOO_YOUNG).disabled).toBe(true);
    });
  });

  describe("pickerBounds governs minDate/maxDate only", () => {
    it("leaves a minDateField-bounded picker unrestricted even under the default", () => {
      // The cross-field limit moves with a sibling and is known only to the
      // form-level refine, so it never reaches the calendar either way — such a
      // field already behaves like "validate".
      setup({ type: "date", name: "end", label: "Date of birth", minDateField: "start" }, { end: undefined });
      openCalendar();
      expect(document.querySelectorAll("td[data-disabled]")).toHaveLength(0);
      const years = yearOptions();
      expect(years).toContain(String(new Date().getFullYear() - 50));
      expect(years).toContain(String(new Date().getFullYear() + 5));
    });
  });

  describe('pickerBounds: "restrict" is the explicit form of the default', () => {
    it("disables out-of-range days", () => {
      setup({ ...dob, pickerBounds: "restrict" });
      openCalendar();
      expect(dayButton(TOO_YOUNG).disabled).toBe(true);
    });
  });
});
