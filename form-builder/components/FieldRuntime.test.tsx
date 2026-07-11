// @vitest-environment jsdom
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { FormProvider, useForm, type UseFormReturn } from "react-hook-form";
import { defaultMessages } from "../core/messages";
import type { AnyFieldConfig } from "../core/types";
import { FieldGate, FieldRuntimeContext, useFieldRuntime } from "./FieldRuntime";

function Probe() {
  const { disabled } = useFieldRuntime();
  return <span data-testid="probe">{disabled ? "disabled" : "enabled"}</span>;
}

function Harness({
  field,
  values,
  verifiedFields,
  isFieldValid,
  parentDisabled = false,
  onForm,
}: {
  field: AnyFieldConfig;
  values?: Record<string, unknown>;
  verifiedFields?: ReadonlySet<string>;
  isFieldValid?: (fieldName: string, value: unknown) => boolean;
  parentDisabled?: boolean;
  onForm?: (form: UseFormReturn) => void;
}) {
  const form = useForm({ defaultValues: values });
  onForm?.(form);
  return (
    <FormProvider {...form}>
      <FieldRuntimeContext.Provider
        value={{ disabled: parentDisabled, messages: defaultMessages, verifiedFields, isFieldValid }}
      >
        <FieldGate field={field}>
          <Probe />
        </FieldGate>
      </FieldRuntimeContext.Provider>
    </FormProvider>
  );
}

const gateChildren = () => screen.queryByTestId("probe");

describe("FieldGate", () => {
  afterEach(cleanup);

  it("hides when visibleWhen does not match", () => {
    render(
      <Harness
        field={{ type: "text", name: "a", visibleWhen: { field: "mode", equals: "on" } }}
        values={{ mode: "off" }}
      />,
    );
    expect(gateChildren()).toBeNull();
  });

  it("shows and disables per disabledWhen", () => {
    render(
      <Harness
        field={{ type: "text", name: "a", disabledWhen: { field: "mode", equals: "lock" } }}
        values={{ mode: "lock" }}
      />,
    );
    expect(screen.getByTestId("probe").textContent).toBe("disabled");
  });

  it("composes parent disabled onto children", () => {
    render(<Harness field={{ type: "text", name: "a" }} parentDisabled />);
    expect(screen.getByTestId("probe").textContent).toBe("disabled");
  });

  it("array visibleWhen requires every condition (AND)", () => {
    const field: AnyFieldConfig = {
      type: "text",
      name: "a",
      visibleWhen: [
        { field: "x", equals: 1 },
        { field: "y", equals: 2 },
      ],
    };
    render(<Harness field={field} values={{ x: 1, y: 0 }} />);
    expect(gateChildren()).toBeNull();
    cleanup();
    render(<Harness field={field} values={{ x: 1, y: 2 }} />);
    expect(gateChildren()).not.toBeNull();
  });

  it("anyOf disabledWhen matches when any group matches (OR)", () => {
    const field: AnyFieldConfig = {
      type: "text",
      name: "a",
      disabledWhen: { anyOf: [[{ field: "x", equals: 1 }], [{ field: "y", equals: 2 }]] },
    };
    render(<Harness field={field} values={{ x: 0, y: 2 }} />);
    expect(screen.getByTestId("probe").textContent).toBe("disabled");
    cleanup();
    render(<Harness field={field} values={{ x: 0, y: 0 }} />);
    expect(screen.getByTestId("probe").textContent).toBe("enabled");
  });

  it("enabledWhen with isValid tracks source values reactively", async () => {
    let form: UseFormReturn | undefined;
    const nonEmpty = (_name: string, value: unknown) => typeof value === "string" && value.length > 0;
    render(
      <Harness
        field={{
          type: "email",
          name: "email",
          enabledWhen: [
            { field: "firstName", isValid: true },
            { field: "lastName", isValid: true },
          ],
        }}
        values={{ firstName: "", lastName: "" }}
        isFieldValid={nonEmpty}
        onForm={(f) => (form = f)}
      />,
    );
    expect(screen.getByTestId("probe").textContent).toBe("disabled");

    await act(async () => form!.setValue("firstName", "Ada"));
    expect(screen.getByTestId("probe").textContent).toBe("disabled");

    await act(async () => form!.setValue("lastName", "Lovelace"));
    expect(screen.getByTestId("probe").textContent).toBe("enabled");
  });

  it("enabledWhenVerified disables until the otp field is in the verified set", () => {
    const field: AnyFieldConfig = { type: "phone", name: "p", enabledWhenVerified: "emailOtp" };
    const { rerender } = render(<Harness field={field} verifiedFields={new Set()} />);
    expect(screen.getByTestId("probe").textContent).toBe("disabled");
    rerender(<Harness field={field} verifiedFields={new Set(["emailOtp"])} />);
    expect(screen.getByTestId("probe").textContent).toBe("enabled");
  });
});

describe("renderField", () => {
  afterEach(cleanup);

  it("unknown type renders the dev error block instead of crashing", async () => {
    const { renderField } = await import("./renderField");
    const { FormProvider: RHFProvider, useForm: useRHForm } = await import("react-hook-form");
    function Host() {
      const form = useRHForm();
      return <RHFProvider {...form}>{renderField({ type: "nope", name: "x" })}</RHFProvider>;
    }
    render(<Host />);
    expect(screen.getByText(/Unknown field type/)).toBeTruthy();
  });

  it("applies the field width classes to the grid cell wrapper", async () => {
    const { renderField } = await import("./renderField");
    const { registerField } = await import("../core/registry");
    const { FormProvider: RHFProvider, useForm: useRHForm } = await import("react-hook-form");
    registerField("width-probe", () => <input />);
    function Host() {
      const form = useRHForm();
      return (
        <RHFProvider {...form}>
          {renderField({ type: "width-probe", name: "w", width: { tablet: "half" } })}
        </RHFProvider>
      );
    }
    const { container } = render(<Host />);
    const tokens = (container.firstElementChild?.className ?? "").split(/\s+/);
    expect(tokens).toContain("col-span-12");
    expect(tokens).toContain("tablet:col-span-6");
    expect(tokens).toContain("desktop:col-span-12");
  });
});
