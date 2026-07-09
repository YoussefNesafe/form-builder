// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { FormProvider, useForm, type UseFormReturn } from "react-hook-form";
import { defaultMessages } from "../core/messages";
import { FieldRuntimeContext } from "../components/FieldRuntime";
import type { FieldConfig } from "../core/types";
import { MaskedField } from "./MaskedField";

type MaskedConfig = Extract<FieldConfig, { type: "masked" }>;

function Harness({
  field,
  defaultValues,
  onForm,
}: {
  field: MaskedConfig;
  defaultValues: Record<string, unknown>;
  onForm: (form: UseFormReturn) => void;
}) {
  const form = useForm({ defaultValues });
  onForm(form);
  return (
    <FormProvider {...form}>
      <FieldRuntimeContext.Provider value={{ disabled: false, messages: defaultMessages }}>
        <MaskedField field={field} />
      </FieldRuntimeContext.Provider>
    </FormProvider>
  );
}

const card: MaskedConfig = { type: "masked", name: "card", label: "Card", mask: "#### #### #### ####" };

function setup(field: MaskedConfig = card, defaultValues: Record<string, unknown> = { card: "" }) {
  let form!: UseFormReturn;
  render(<Harness field={field} defaultValues={defaultValues} onForm={(f) => (form = f)} />);
  return () => form;
}

const input = (label = "Card") => screen.getByLabelText(label) as HTMLInputElement;

describe("MaskedField", () => {
  afterEach(cleanup);

  it("typing raw digits stores raw and displays formatted", () => {
    const form = setup();
    fireEvent.change(input(), { target: { value: "4111111111111111" } });
    expect(form().getValues("card")).toBe("4111111111111111");
    expect(input().value).toBe("4111 1111 1111 1111");
  });

  it("pasting a formatted string extracts the raw value", () => {
    const form = setup();
    fireEvent.change(input(), { target: { value: "4111 1111 1111 1111" } });
    expect(form().getValues("card")).toBe("4111111111111111");
  });

  it("chars outside the token class are dropped", () => {
    const form = setup();
    fireEvent.change(input(), { target: { value: "41ab11" } });
    expect(form().getValues("card")).toBe("4111");
    expect(input().value).toBe("4111");
  });

  it("deleting from the end updates raw and display", () => {
    const form = setup(card, { card: "41111" });
    expect(input().value).toBe("4111 1");
    fireEvent.change(input(), { target: { value: "4111 " } });
    expect(form().getValues("card")).toBe("4111");
    expect(input().value).toBe("4111");
  });

  it("input is capped at the mask length and placeholder falls back to the mask", () => {
    setup();
    expect(input().maxLength).toBe(card.mask.length);
    expect(input().placeholder).toBe(card.mask);
  });

  it("digit-only mask gets numeric inputMode, mixed mask does not", () => {
    setup();
    expect(input().getAttribute("inputmode")).toBe("numeric");
    cleanup();
    setup({ type: "masked", name: "card", label: "Card", mask: "AA-##" });
    expect(input().getAttribute("inputmode")).toBeNull();
  });

  it("tolerates a missing default value", () => {
    setup(card, {});
    expect(input().value).toBe("");
  });

  it("renders error text with aria wiring", async () => {
    const form = setup();
    await act(async () => form().setError("card", { type: "manual", message: "boom" }));
    expect(screen.getByText("boom")).toBeTruthy();
    expect(input().getAttribute("aria-invalid")).toBe("true");
    const describedBy = input().getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy!)?.textContent).toBe("boom");
  });
});
