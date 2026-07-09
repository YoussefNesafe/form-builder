// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { FormProvider, useForm, type UseFormReturn } from "react-hook-form";
import { defaultMessages } from "../core/messages";
import { FieldRuntimeContext } from "../components/FieldRuntime";
import type { FieldConfig } from "../core/types";
import { SegmentedField } from "./SegmentedField";

type SegmentedConfig = Extract<FieldConfig, { type: "segmented" }>;

function Harness({
  field,
  defaultValues,
  onForm,
}: {
  field: SegmentedConfig;
  defaultValues: Record<string, unknown>;
  onForm: (form: UseFormReturn) => void;
}) {
  const form = useForm({ defaultValues });
  onForm(form);
  return (
    <FormProvider {...form}>
      <FieldRuntimeContext.Provider value={{ disabled: false, messages: defaultMessages }}>
        <SegmentedField field={field} />
      </FieldRuntimeContext.Provider>
    </FormProvider>
  );
}

const config: SegmentedConfig = {
  type: "segmented",
  name: "plan",
  label: "Plan",
  options: [
    { label: "Basic", value: "basic" },
    { label: "Pro", value: 2 },
    { label: "Max", value: "max", disabled: true },
  ],
};

function setup(field: SegmentedConfig = config, defaultValues: Record<string, unknown> = { plan: undefined }) {
  let form!: UseFormReturn;
  render(<Harness field={field} defaultValues={defaultValues} onForm={(f) => (form = f)} />);
  return () => form;
}

describe("SegmentedField", () => {
  afterEach(cleanup);

  it("renders one button per option", () => {
    setup();
    expect(screen.getByRole("radio", { name: "Basic" })).toBeTruthy();
    expect(screen.getByRole("radio", { name: "Pro" })).toBeTruthy();
    expect(screen.getByRole("radio", { name: "Max" })).toBeTruthy();
  });

  it("click selects and preserves the option value type", () => {
    const form = setup();
    fireEvent.click(screen.getByRole("radio", { name: "Pro" }));
    expect(form().getValues("plan")).toBe(2);
    fireEvent.click(screen.getByRole("radio", { name: "Basic" }));
    expect(form().getValues("plan")).toBe("basic");
  });

  it("selected option is marked checked", () => {
    setup(config, { plan: 2 });
    expect(screen.getByRole("radio", { name: "Pro" }).getAttribute("aria-checked")).toBe("true");
    expect(screen.getByRole("radio", { name: "Basic" }).getAttribute("aria-checked")).toBe("false");
  });

  it("disabled option cannot be selected", () => {
    const form = setup();
    fireEvent.click(screen.getByRole("radio", { name: "Max" }));
    expect(form().getValues("plan")).toBeUndefined();
  });

  it("field-level disabled blocks all options", () => {
    const form = setup({ ...config, disabled: true });
    fireEvent.click(screen.getByRole("radio", { name: "Basic" }));
    expect(form().getValues("plan")).toBeUndefined();
  });

  it("renders error text with aria wiring on the group", async () => {
    const form = setup();
    await act(async () => form().setError("plan", { type: "manual", message: "boom" }));
    expect(screen.getByText("boom")).toBeTruthy();
    const group = screen.getByRole("radiogroup");
    const describedBy = group.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy!)?.textContent).toBe("boom");
  });
});
