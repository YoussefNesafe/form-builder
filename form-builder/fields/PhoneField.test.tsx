// @vitest-environment jsdom
import { StrictMode } from "react";
import { act, cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FormProvider, useForm, type Resolver, type UseFormReturn } from "react-hook-form";
import { defaultMessages } from "../core/messages";
import { FieldRuntimeContext } from "../components/FieldRuntime";
import type { FieldConfig } from "../core/types";
import { PhoneField } from "./PhoneField";

type PhoneConfig = Extract<FieldConfig, { type: "phone" }>;

function Harness({
  field,
  defaultValues,
  onForm,
  resolver,
}: {
  field: PhoneConfig;
  defaultValues: Record<string, unknown>;
  onForm: (form: UseFormReturn) => void;
  resolver?: Resolver;
}) {
  const form = useForm({ defaultValues, resolver });
  onForm(form);
  return (
    <FormProvider {...form}>
      <FieldRuntimeContext.Provider value={{ disabled: false, messages: defaultMessages }}>
        <PhoneField field={field} />
      </FieldRuntimeContext.Provider>
    </FormProvider>
  );
}

function setup(field: PhoneConfig, defaultValues: Record<string, unknown>, resolver?: Resolver) {
  let form!: UseFormReturn;
  render(
    <Harness field={field} defaultValues={defaultValues} onForm={(f) => (form = f)} resolver={resolver} />,
  );
  return () => form;
}

const alwaysInvalidMobile: Resolver = async () => ({
  values: {},
  errors: { mobile: { type: "always", message: "invalid" } },
});

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

  it("StrictMode: seeds exactly once and still syncs once after the simulated remount", async () => {
    let form!: UseFormReturn;
    render(
      <StrictMode>
        <Harness field={synced} defaultValues={{ residence: "AE", mobile: "" }} onForm={(f) => (form = f)} />
      </StrictMode>,
    );
    expect(form.getValues("mobile")).toBe("+971");
    await act(async () => form.setValue("residence", "EG"));
    expect(form.getValues("mobile")).toBe("+20");
  });

  it("dev-warns once and keeps the value when the source emits a non-ISO value", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      const form = setup(synced, { residence: "EG", mobile: "+201001234567" });
      await act(async () => form().setValue("residence", "ZZ"));
      expect(form().getValues("mobile")).toBe("+201001234567");
      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn.mock.calls[0][0]).toContain('non-ISO value "ZZ"');
    } finally {
      warn.mockRestore();
    }
  });

  it("mount seed leaves the field pristine (not dirty, not touched)", () => {
    const form = setup(synced, { residence: "AE", mobile: "" });
    expect(form().getValues("mobile")).toBe("+971");
    const state = form().getFieldState("mobile");
    expect(state.isDirty).toBe(false);
    expect(state.isTouched).toBe(false);
  });

  it("change-path rewrite marks the field dirty but does not validate an untouched field", async () => {
    const form = setup(synced, { residence: "EG", mobile: "+201001234567" }, alwaysInvalidMobile);
    await act(async () => form().setValue("residence", "AE"));
    const state = form().getFieldState("mobile");
    expect(state.isDirty).toBe(true);
    expect(state.error).toBeUndefined();
  });

  it("change-path rewrite re-validates a touched field", async () => {
    const form = setup(synced, { residence: "EG", mobile: "+201001234567" }, alwaysInvalidMobile);
    await act(async () => form().setValue("mobile", "+201001234567", { shouldTouch: true }));
    expect(form().getFieldState("mobile").error).toBeUndefined();
    await act(async () => form().setValue("residence", "AE"));
    expect(form().getFieldState("mobile").error).toBeDefined();
  });
});
