// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { FormProvider, useForm, type UseFormReturn } from "react-hook-form";
import { defaultMessages } from "../core/messages";
import { FieldRuntimeContext } from "../components/FieldRuntime";
import type { FieldConfig } from "../core/types";
import { RatingField } from "./RatingField";

type RatingConfig = Extract<FieldConfig, { type: "rating" }>;

function Harness({
  field,
  defaultValues,
  onForm,
}: {
  field: RatingConfig;
  defaultValues: Record<string, unknown>;
  onForm: (form: UseFormReturn) => void;
}) {
  const form = useForm({ defaultValues });
  onForm(form);
  return (
    <FormProvider {...form}>
      <FieldRuntimeContext.Provider value={{ disabled: false, messages: defaultMessages }}>
        <RatingField field={field} />
      </FieldRuntimeContext.Provider>
    </FormProvider>
  );
}

function setup(field: RatingConfig, defaultValues: Record<string, unknown> = { stars: undefined }) {
  let form!: UseFormReturn;
  render(<Harness field={field} defaultValues={defaultValues} onForm={(f) => (form = f)} />);
  return () => form;
}

const stars = () => screen.getAllByRole("radio");

describe("RatingField", () => {
  afterEach(cleanup);

  it("renders max radios in a radiogroup with value labels", () => {
    setup({ type: "rating", name: "stars", label: "Stars", max: 7 });
    expect(screen.getByRole("radiogroup")).toBeTruthy();
    expect(stars()).toHaveLength(7);
    expect(stars()[2].getAttribute("aria-label")).toBe(defaultMessages.ratingValue(3, 7));
  });

  it("defaults to 5 stars", () => {
    setup({ type: "rating", name: "stars", label: "Stars" });
    expect(stars()).toHaveLength(5);
  });

  it("click selects the value and marks aria-checked", () => {
    const form = setup({ type: "rating", name: "stars", label: "Stars" });
    fireEvent.click(stars()[2]);
    expect(form().getValues("stars")).toBe(3);
    expect(stars()[2].getAttribute("aria-checked")).toBe("true");
    expect(stars()[3].getAttribute("aria-checked")).toBe("false");
  });

  it("clicking the current value clears when optional", () => {
    const form = setup({ type: "rating", name: "stars", label: "Stars" }, { stars: 3 });
    fireEvent.click(stars()[2]);
    expect(form().getValues("stars")).toBeUndefined();
  });

  it("clicking the current value keeps it when required", () => {
    const form = setup({ type: "rating", name: "stars", label: "Stars", required: true }, { stars: 3 });
    fireEvent.click(stars()[2]);
    expect(form().getValues("stars")).toBe(3);
  });

  it("arrow keys step the value within 1..max", () => {
    const form = setup({ type: "rating", name: "stars", label: "Stars" }, { stars: 4 });
    fireEvent.keyDown(screen.getByRole("radiogroup"), { key: "ArrowRight" });
    expect(form().getValues("stars")).toBe(5);
    fireEvent.keyDown(screen.getByRole("radiogroup"), { key: "ArrowRight" });
    expect(form().getValues("stars")).toBe(5);
    fireEvent.keyDown(screen.getByRole("radiogroup"), { key: "ArrowLeft" });
    expect(form().getValues("stars")).toBe(4);
  });

  it("arrow keys move DOM focus along with the selection", () => {
    setup({ type: "rating", name: "stars", label: "Stars" }, { stars: 2 });
    stars()[1].focus();
    fireEvent.keyDown(screen.getByRole("radiogroup"), { key: "ArrowRight" });
    expect(document.activeElement).toBe(stars()[2]);
    expect(stars()[2].getAttribute("aria-checked")).toBe("true");
  });

  it("roving tabindex: checked star is the tab stop, first star when unset", () => {
    setup({ type: "rating", name: "stars", label: "Stars" }, { stars: 3 });
    expect(stars().map((star) => star.tabIndex)).toEqual([-1, -1, 0, -1, -1]);
    cleanup();
    setup({ type: "rating", name: "stars", label: "Stars" });
    expect(stars().map((star) => star.tabIndex)).toEqual([0, -1, -1, -1, -1]);
  });

  it("any first arrow press from no selection lands on 1 star", () => {
    const form = setup({ type: "rating", name: "stars", label: "Stars" });
    fireEvent.keyDown(screen.getByRole("radiogroup"), { key: "ArrowLeft" });
    expect(form().getValues("stars")).toBe(1);
  });

  it("honors disabled", () => {
    const form = setup({ type: "rating", name: "stars", label: "Stars", disabled: true });
    fireEvent.click(stars()[0]);
    expect(form().getValues("stars")).toBeUndefined();
  });

  it("renders error text with aria wiring", async () => {
    const form = setup({ type: "rating", name: "stars", label: "Stars" });
    await act(async () => form().setError("stars", { type: "manual", message: "boom" }));
    expect(screen.getByText("boom")).toBeTruthy();
    const group = screen.getByRole("radiogroup");
    const describedBy = group.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy!)?.textContent).toBe("boom");
  });
});
