// @vitest-environment jsdom
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { FormProvider, useForm, type UseFormReturn } from "react-hook-form";
import { defaultMessages } from "../core/messages";
import type { AnyFieldConfig } from "../core/types";
import { FieldRuntimeContext } from "../components/FieldRuntime";
import { SelectField } from "./SelectField";

afterEach(cleanup);

// cmdk (combobox list) needs ResizeObserver; jsdom has none.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.ResizeObserver = window.ResizeObserver ?? (ResizeObserverStub as typeof ResizeObserver);
window.HTMLElement.prototype.scrollIntoView = window.HTMLElement.prototype.scrollIntoView ?? (() => {});

const cityMap = {
  US: [
    { label: "New York", value: "nyc" },
    { label: "Austin", value: "atx" },
  ],
  AE: [{ label: "Dubai", value: "dxb" }],
};

function Harness({
  field,
  values,
  onForm,
}: {
  field: AnyFieldConfig;
  values?: Record<string, unknown>;
  onForm?: (form: UseFormReturn) => void;
}) {
  const form = useForm({ defaultValues: values });
  onForm?.(form);
  return (
    <FormProvider {...form}>
      <FieldRuntimeContext.Provider value={{ disabled: false, messages: defaultMessages }}>
        <SelectField field={field} />
      </FieldRuntimeContext.Provider>
    </FormProvider>
  );
}

describe("select optionsFrom", () => {
  it("resets a stale single value when the source changes branches", async () => {
    let form: UseFormReturn | undefined;
    render(
      <Harness
        field={{ type: "select", name: "city", optionsFrom: { field: "country", map: cityMap } }}
        values={{ country: "US", city: "nyc" }}
        onForm={(f) => (form = f)}
      />,
    );
    await act(async () => {});
    // Mount is baseline — the existing valid value stays.
    expect(form!.getValues("city")).toBe("nyc");

    await act(async () => form!.setValue("country", "AE"));
    expect(form!.getValues("city")).toBeUndefined();
  });

  it("keeps a value that also exists in the new branch, filters multiple values", async () => {
    let form: UseFormReturn | undefined;
    const sharedMap = {
      US: [{ label: "Shared", value: "shared" }],
      AE: [{ label: "Shared", value: "shared" }, { label: "Dubai", value: "dxb" }],
    };
    render(
      <Harness
        field={{ type: "select", name: "city", optionsFrom: { field: "country", map: sharedMap } }}
        values={{ country: "US", city: "shared" }}
        onForm={(f) => (form = f)}
      />,
    );
    await act(async () => {});
    await act(async () => form!.setValue("country", "AE"));
    expect(form!.getValues("city")).toBe("shared");

    cleanup();
    render(
      <Harness
        field={{
          type: "select",
          name: "cities",
          multiple: true,
          optionsFrom: { field: "country", map: cityMap },
        }}
        values={{ country: "US", cities: ["nyc", "atx"] }}
        onForm={(f) => (form = f)}
      />,
    );
    await act(async () => {});
    await act(async () => form!.setValue("country", "AE"));
    // Neither nyc nor atx exists in the AE branch.
    expect(form!.getValues("cities")).toEqual([]);
  });

  it("renders a disabled placeholder state for a missing branch", async () => {
    render(
      <Harness
        field={{
          type: "select",
          name: "city",
          placeholder: "Pick a city",
          optionsFrom: { field: "country", map: cityMap },
        }}
        values={{ country: "DE" }}
      />,
    );
    await act(async () => {});
    const trigger = screen.getByRole("combobox") as HTMLButtonElement;
    expect(trigger.disabled || trigger.getAttribute("data-disabled") !== null).toBe(true);
  });

  it("offers the branch options of the current source value", async () => {
    render(
      <Harness
        field={{
          type: "select",
          name: "city",
          searchable: true,
          optionsFrom: { field: "country", map: cityMap },
        }}
        values={{ country: "AE" }}
      />,
    );
    await act(async () => {});
    // Searchable → combobox popover; open it and check branch content.
    const trigger = screen.getByRole("combobox");
    await act(async () => {
      trigger.click();
    });
    expect(screen.getByText("Dubai")).toBeTruthy();
    expect(screen.queryByText("New York")).toBeNull();
  });
});
