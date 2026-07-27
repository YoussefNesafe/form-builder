// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { registerBuiltInFields } from "../fields";
import { registerField } from "../core/registry";
import type { AnyFieldConfig } from "../core/types";
import { FormRenderer } from "../components/FormRenderer";
import { FieldWrapper, fieldAriaDescribedBy } from "./FieldWrapper";

registerBuiltInFields();
afterEach(cleanup);

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.ResizeObserver = window.ResizeObserver ?? (ResizeObserverStub as typeof ResizeObserver);

const noop = () => {};

/**
 * Drives the badge the way a consumer does: config in, rendering out. Nothing
 * here reaches into a field component — that is the point of the mechanism.
 */
function renderFields(...fields: AnyFieldConfig[]) {
  return render(<FormRenderer config={{ id: "kyc", fields }} onSubmit={noop} />);
}

describe("FieldWrapper badge", () => {
  it("renders from config alone, with no field component passing it through", () => {
    renderFields({
      type: "text",
      name: "taxId",
      label: "Tax identification number",
      badge: "Required in Germany",
    });

    expect(
      screen.getByRole("textbox", { name: "Tax identification number Required in Germany" }),
    ).toBeTruthy();
  });

  it("reaches a field type whose wrapper renders a legend instead of a label", () => {
    // radio renders `asGroup` (fieldset/legend); text renders a plain label.
    // Both branches have to pick the badge up, and neither field component
    // knows the prop exists.
    renderFields({
      type: "radio",
      name: "residency",
      label: "Country of residence",
      badge: "Drives the document list",
      options: [{ label: "Germany", value: "de" }],
    });

    expect(
      screen.getByRole("group", { name: "Country of residence Drives the document list" }),
    ).toBeTruthy();
  });

  it("reaches a custom field type registered by the consumer", () => {
    // Custom types go through renderField/FieldGate like every built-in, so
    // they inherit the badge without opting in to anything.
    registerField("iban", ({ field }) => (
      <FieldWrapper id="iban-input" label={field.label}>
        <input id="iban-input" />
      </FieldWrapper>
    ));

    renderFields({ type: "iban", name: "iban", label: "IBAN", badge: "SEPA only" });

    expect(screen.getByRole("textbox", { name: "IBAN SEPA only" })).toBeTruthy();
  });

  it("joins the accessible name; the required mark stays out of it", () => {
    renderFields({
      type: "text",
      name: "taxId",
      label: "Tax identification number",
      required: true,
      badge: "Required in Germany",
    });

    // The `*` is rendered but aria-hidden — `required` already reaches assistive
    // tech through the control. The badge has no second channel, so it is named.
    expect(screen.getByText("*")).toBeTruthy();
    expect(
      screen.getByRole("textbox", { name: "Tax identification number Required in Germany" }),
    ).toBeTruthy();
  });

  it("changes nothing when absent", () => {
    const { container } = renderFields({
      type: "text",
      name: "taxId",
      label: "Tax identification number",
    });

    expect(screen.getByRole("textbox", { name: "Tax identification number" })).toBeTruthy();
    expect(container.querySelector("label")?.textContent).toBe("Tax identification number");
  });

  it("renders nothing for an empty string", () => {
    const { container } = renderFields({
      type: "text",
      name: "taxId",
      label: "Tax identification number",
      badge: "",
    });

    expect(screen.getByRole("textbox", { name: "Tax identification number" })).toBeTruthy();
    expect(container.querySelector("label")?.textContent).toBe("Tax identification number");
  });

  it("renders nothing without a label to annotate", () => {
    renderFields({ type: "text", name: "taxId", badge: "Required in Germany" });

    expect(screen.queryByText("Required in Germany")).toBeNull();
  });

  it("is absent when the wrapper renders outside a FieldGate", () => {
    render(
      <FieldWrapper id="standalone" label="Tax identification number">
        <input id="standalone" />
      </FieldWrapper>,
    );

    expect(screen.getByRole("textbox", { name: "Tax identification number" })).toBeTruthy();
  });
});

describe("FieldWrapper description", () => {
  const description = (
    <>
      Upload a <a href="/help">recent utility bill</a>
    </>
  );

  it("accepts a ReactNode and keeps it wired to the control", () => {
    render(
      <FieldWrapper id="proof" label="Proof of address" description={description}>
        <input id="proof" aria-describedby={fieldAriaDescribedBy("proof", { description })} />
      </FieldWrapper>,
    );

    const input = screen.getByRole("textbox", {
      name: "Proof of address",
      description: "Upload a recent utility bill",
    });
    expect(input.getAttribute("aria-describedby")).toBe("proof-description");
    expect(screen.getByRole("link", { name: "recent utility bill" })).toBeTruthy();
  });

  it("emits the describedby id only when the description renders", () => {
    // FieldWrapper and fieldAriaDescribedBy gate on the same truthiness, so a
    // control can never point at an id that was never rendered.
    render(
      <FieldWrapper id="proof" label="Proof of address" description={null}>
        <input id="proof" aria-describedby={fieldAriaDescribedBy("proof", { description: null })} />
      </FieldWrapper>,
    );

    expect(screen.getByRole("textbox", { name: "Proof of address" }).getAttribute("aria-describedby")).toBeNull();
    expect(document.getElementById("proof-description")).toBeNull();
  });
});
