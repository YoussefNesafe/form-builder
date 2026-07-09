// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { FormProvider, useForm, type UseFormReturn } from "react-hook-form";
import { defaultMessages } from "../core/messages";
import { FieldRuntimeContext } from "../components/FieldRuntime";
import type { FieldConfig } from "../core/types";
import { CountryField } from "./CountryField";
import { PhoneField } from "./PhoneField";

type CountryConfig = Extract<FieldConfig, { type: "country" }>;

function Harness({
  field,
  defaultValues,
  onForm,
  withPhone,
}: {
  field: CountryConfig;
  defaultValues: Record<string, unknown>;
  onForm: (form: UseFormReturn) => void;
  withPhone?: boolean;
}) {
  const form = useForm({ defaultValues });
  onForm(form);
  return (
    <FormProvider {...form}>
      <FieldRuntimeContext.Provider value={{ disabled: false, messages: defaultMessages }}>
        <CountryField field={field} />
        {withPhone && (
          <PhoneField field={{ type: "phone", name: "mobile", countryFrom: field.name }} />
        )}
      </FieldRuntimeContext.Provider>
    </FormProvider>
  );
}

const config: CountryConfig = {
  type: "country",
  name: "residence",
  label: "Residence",
  countries: ["NL", "AE", "EG"],
};

function setup(
  field: CountryConfig = config,
  defaultValues: Record<string, unknown> = { residence: undefined },
  withPhone = false,
) {
  let form!: UseFormReturn;
  render(
    <Harness field={field} defaultValues={defaultValues} onForm={(f) => (form = f)} withPhone={withPhone} />,
  );
  return () => form;
}

// The popover's Command input is itself role="combobox"; the trigger is the
// one with the field's accessible name.
const trigger = () => screen.getByRole("combobox", { name: /Residence/ });
const openCombobox = () => fireEvent.click(trigger());

describe("CountryField", () => {
  beforeAll(() => {
    // jsdom lacks both; radix popover + cmdk need them.
    globalThis.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as unknown as typeof ResizeObserver;
    Element.prototype.scrollIntoView = vi.fn();
  });

  afterEach(cleanup);

  it("renders a combobox listing the configured countries with display names", () => {
    setup();
    openCombobox();
    expect(screen.getByRole("option", { name: /Netherlands/ })).toBeTruthy();
    expect(screen.getByRole("option", { name: /United Arab Emirates/ })).toBeTruthy();
    expect(screen.getByRole("option", { name: /Egypt/ })).toBeTruthy();
  });

  it("picking a country stores the ISO code and shows the name on the trigger", () => {
    const form = setup();
    openCombobox();
    fireEvent.click(screen.getByRole("option", { name: /Egypt/ }));
    expect(form().getValues("residence")).toBe("EG");
    expect(trigger().textContent).toContain("Egypt");
  });

  it("search filters the list", () => {
    setup();
    openCombobox();
    fireEvent.change(screen.getByPlaceholderText(defaultMessages.country), { target: { value: "nether" } });
    expect(screen.getByRole("option", { name: /Netherlands/ })).toBeTruthy();
    expect(screen.queryByRole("option", { name: /Egypt/ })).toBeNull();
  });

  it("preferred countries are listed first", () => {
    setup({ ...config, preferredCountries: ["EG"] });
    openCombobox();
    const options = screen.getAllByRole("option");
    expect(options[0].textContent).toContain("Egypt");
  });

  it("flag is rendered for the selected country on the trigger", () => {
    setup(config, { residence: "NL" });
    const triggerElement = trigger();
    expect(triggerElement.querySelector("svg")).toBeTruthy();
  });

  it("works as a countryFrom source: picking a country re-syncs the phone", async () => {
    const form = setup(config, { residence: undefined, mobile: "" }, true);
    openCombobox();
    await act(async () => {
      fireEvent.click(screen.getByRole("option", { name: /United Arab Emirates/ }));
    });
    expect(form().getValues("mobile")).toBe("+971");
  });

  it("renders error text with aria wiring", async () => {
    const form = setup();
    await act(async () => form().setError("residence", { type: "manual", message: "boom" }));
    expect(screen.getByText("boom")).toBeTruthy();
    const triggerElement = trigger();
    expect(triggerElement.getAttribute("aria-invalid")).toBe("true");
    const describedBy = triggerElement.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy!)?.textContent).toBe("boom");
  });
});
