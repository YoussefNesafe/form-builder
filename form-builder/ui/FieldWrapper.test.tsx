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
 * The accessible name a badged field should have. FieldWrapper separates label
 * from badge with a hidden comma; whether a space lands either side of it
 * depends on the badge's computed display, i.e. on whether CSS has loaded
 * (verified: "number , badge" styled, "number,badge" unstyled). Screen readers
 * pause on the comma and never voice the spacing, so both are correct — pinning
 * the jsdom-only form would pin an artifact of the test environment.
 */
const named = (label: string, badge: string) => new RegExp(`^${label} ?, ?${badge}$`);

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
      screen.getByRole("textbox", { name: named("Tax identification number", "Required in Germany") }),
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
      screen.getByRole("group", { name: named("Country of residence", "Drives the document list") }),
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

    expect(screen.getByRole("textbox", { name: named("IBAN", "SEPA only") })).toBeTruthy();
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
      screen.getByRole("textbox", { name: named("Tax identification number", "Required in Germany") }),
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

  it("takes a prop where there is no gate to read config from", () => {
    render(
      <FieldWrapper id="standalone" label="Tax identification number" badge="Required in Germany">
        <input id="standalone" />
      </FieldWrapper>,
    );

    expect(
      screen.getByRole("textbox", { name: named("Tax identification number", "Required in Germany") }),
    ).toBeTruthy();
  });

  it("lets the prop override the config the gate published", () => {
    registerField("override-probe", () => (
      <FieldWrapper id="override-input" label="IBAN" badge="From the prop">
        <input id="override-input" />
      </FieldWrapper>
    ));

    renderFields({ type: "override-probe", name: "iban", label: "IBAN", badge: "From the config" });

    expect(screen.getByRole("textbox", { name: named("IBAN", "From the prop") })).toBeTruthy();
  });

  it("exposes a data-slot so a consumer can restyle it", () => {
    // The engine ships as source a consumer edits; every shadcn primitive this
    // wrapper composes carries one, and BADGE_CLASS is module-private.
    const { container } = renderFields({
      type: "text",
      name: "taxId",
      label: "Tax identification number",
      badge: "Required in Germany",
    });

    expect(container.querySelector('[data-slot="field-badge"]')?.textContent).toBe("Required in Germany");
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

  it("renders a zero rather than dropping it as falsy", () => {
    // ReactNode admits values that are falsy but do render. A `&&` guard would
    // drop the element while fieldAriaDescribedBy still had to agree with it —
    // a non-issue while the prop was `string`, opened by widening it.
    render(
      <FieldWrapper id="count" label="Prior filings" description={0}>
        <input id="count" aria-describedby={fieldAriaDescribedBy("count", { description: 0 })} />
      </FieldWrapper>,
    );

    const input = screen.getByRole("textbox", { name: "Prior filings", description: "0" });
    expect(input.getAttribute("aria-describedby")).toBe("count-description");
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
