// @vitest-environment jsdom
import { act, cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { FormProvider, useForm, type UseFormReturn } from "react-hook-form";
import { defaultMessages } from "../core/messages";
import { FieldRuntimeContext } from "../components/FieldRuntime";
import type { FieldConfig } from "../core/types";
import { PhoneField } from "./PhoneField";

type PhoneConfig = Extract<FieldConfig, { type: "phone" }>;

function Harness({
  field,
  defaultValues,
  onForm,
}: {
  field: PhoneConfig;
  defaultValues: Record<string, unknown>;
  onForm: (form: UseFormReturn) => void;
}) {
  const form = useForm({ defaultValues });
  onForm(form);
  return (
    <FormProvider {...form}>
      <FieldRuntimeContext.Provider value={{ disabled: false, messages: defaultMessages }}>
        <PhoneField field={field} />
      </FieldRuntimeContext.Provider>
    </FormProvider>
  );
}

function setup(field: PhoneConfig, defaultValues: Record<string, unknown>) {
  let form!: UseFormReturn;
  render(<Harness field={field} defaultValues={defaultValues} onForm={(f) => (form = f)} />);
  return () => form;
}

const synced: PhoneConfig = { type: "phone", name: "mobile", countryFrom: "residence" };

describe("PhoneField countryFrom sync", () => {
  afterEach(cleanup);

  it("rewrites the calling code when the source changes, preserving national digits", async () => {
    const form = setup(synced, { residence: "EG", mobile: "+201001234567" });
    await act(async () => form().setValue("residence", "AE"));
    expect(form().getValues("mobile")).toBe("+9711001234567");
  });

  it("does not clobber an existing phone value on mount", () => {
    const form = setup(synced, { residence: "AE", mobile: "+201001234567" });
    expect(form().getValues("mobile")).toBe("+201001234567");
  });

  it("seeds an empty phone from the source on mount", () => {
    const form = setup(synced, { residence: "AE", mobile: "" });
    expect(form().getValues("mobile")).toBe("+971");
  });

  it("keeps the current value when the source is cleared", async () => {
    const form = setup(synced, { residence: "EG", mobile: "+201001234567" });
    await act(async () => form().setValue("residence", ""));
    expect(form().getValues("mobile")).toBe("+201001234567");
  });

  it("re-syncs after a manual phone change when the source changes again", async () => {
    const form = setup(synced, { residence: "EG", mobile: "" });
    await act(async () => form().setValue("mobile", "+966501234567"));
    await act(async () => form().setValue("residence", "AE"));
    expect(form().getValues("mobile")).toBe("+971501234567");
  });

  it("without countryFrom, source changes never touch the phone value", async () => {
    const form = setup({ type: "phone", name: "mobile" }, { residence: "EG", mobile: "+201001234567" });
    await act(async () => form().setValue("residence", "AE"));
    expect(form().getValues("mobile")).toBe("+201001234567");
  });
});
