// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { FormProvider, useForm } from "react-hook-form";
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
  parentDisabled = false,
}: {
  field: AnyFieldConfig;
  values?: Record<string, unknown>;
  verifiedFields?: ReadonlySet<string>;
  parentDisabled?: boolean;
}) {
  const form = useForm({ defaultValues: values });
  return (
    <FormProvider {...form}>
      <FieldRuntimeContext.Provider
        value={{ disabled: parentDisabled, messages: defaultMessages, verifiedFields }}
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
