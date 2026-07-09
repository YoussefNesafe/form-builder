// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { FormProvider, useForm, type UseFormReturn } from "react-hook-form";
import { defaultMessages } from "../core/messages";
import { FieldRuntimeContext } from "../components/FieldRuntime";
import type { FieldConfig } from "../core/types";
import { TimeField } from "./TimeField";

type TimeConfig = Extract<FieldConfig, { type: "time" }>;

function Harness({
  field,
  defaultValues,
  onForm,
}: {
  field: TimeConfig;
  defaultValues: Record<string, unknown>;
  onForm: (form: UseFormReturn) => void;
}) {
  const form = useForm({ defaultValues });
  onForm(form);
  return (
    <FormProvider {...form}>
      <FieldRuntimeContext.Provider value={{ disabled: false, messages: defaultMessages }}>
        <TimeField field={field} />
      </FieldRuntimeContext.Provider>
    </FormProvider>
  );
}

function setup(field: TimeConfig, defaultValues: Record<string, unknown> = { meeting: "" }) {
  let form!: UseFormReturn;
  render(<Harness field={field} defaultValues={defaultValues} onForm={(f) => (form = f)} />);
  return () => form;
}

describe("TimeField", () => {
  afterEach(cleanup);

  it("renders a labeled native time input with min/max/step attributes", () => {
    setup({ type: "time", name: "meeting", label: "Meeting", minTime: "09:00", maxTime: "17:00", stepMinutes: 15 });
    const input = screen.getByLabelText("Meeting") as HTMLInputElement;
    expect(input.type).toBe("time");
    expect(input.min).toBe("09:00");
    expect(input.max).toBe("17:00");
    expect(input.step).toBe("900");
  });

  it("writes changes into form state", () => {
    const form = setup({ type: "time", name: "meeting", label: "Meeting" });
    fireEvent.change(screen.getByLabelText("Meeting"), { target: { value: "13:45" } });
    expect(form().getValues("meeting")).toBe("13:45");
  });

  it("shows the current form value", () => {
    setup({ type: "time", name: "meeting", label: "Meeting" }, { meeting: "08:15" });
    expect((screen.getByLabelText("Meeting") as HTMLInputElement).value).toBe("08:15");
  });

  it("honors disabled", () => {
    setup({ type: "time", name: "meeting", label: "Meeting", disabled: true });
    expect((screen.getByLabelText("Meeting") as HTMLInputElement).disabled).toBe(true);
  });

  it("renders error text and wires aria-invalid/aria-describedby", async () => {
    const form = setup({ type: "time", name: "meeting", label: "Meeting" });
    await act(async () => form().setError("meeting", { type: "manual", message: "boom" }));
    expect(screen.getByText("boom")).toBeTruthy();
    const input = screen.getByLabelText("Meeting") as HTMLInputElement;
    expect(input.getAttribute("aria-invalid")).toBe("true");
    const describedBy = input.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy!)?.textContent).toBe("boom");
  });
});
