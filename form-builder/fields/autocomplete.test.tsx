// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { registerBuiltInFields } from "./index";
import type { FormConfig } from "../core/types";
import { FormRenderer } from "../components/FormRenderer";

registerBuiltInFields();
afterEach(cleanup);

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.ResizeObserver = window.ResizeObserver ?? (ResizeObserverStub as typeof ResizeObserver);

/**
 * `BaseField.autocomplete` is what WCAG 2.2 SC 1.3.5 asks for, and it is the
 * one base prop that no shared wrapper can deliver: `badge` reaches all 24
 * types through `FieldWrapper` because it decorates the label, but this has to
 * land on the control itself, which every field component builds for itself.
 * So there is no single place a reviewer can look to see whether it works —
 * hence one test that asks the real registry for every type that has a native
 * input, through the real renderer.
 *
 * A component that forgets to forward it fails here and nowhere else.
 */
const control = (label: string) => screen.getByLabelText(label);
const autocompleteOf = (label: string) => control(label).getAttribute("autocomplete");

describe("BaseField.autocomplete reaches the control", () => {
  it("lands on every field type whose control is a native text-entry input", () => {
    const config: FormConfig = {
      id: "ac",
      fields: [
        { type: "text", name: "fullName", label: "Full name", autocomplete: "name" },
        { type: "email", name: "email", label: "Email", autocomplete: "email" },
        { type: "password", name: "password", label: "Password", autocomplete: "new-password" },
        { type: "textarea", name: "street", label: "Street", autocomplete: "street-address" },
        { type: "number", name: "birthYear", label: "Birth year", autocomplete: "bday-year" },
        { type: "masked", name: "card", label: "Card", mask: "#### #### #### ####", autocomplete: "cc-number" },
        { type: "time", name: "slot", label: "Slot", autocomplete: "off" },
        { type: "phone", name: "phone", label: "Phone", autocomplete: "mobile tel" },
        // Deliberately NOT "one-time-code": that is input-otp's own default, so
        // asserting it would pass just as well against a component that never
        // forwarded the prop at all. "off" is also the real reason to set this
        // one — keeping a password manager out of the code box on a shared
        // machine is the only thing a config can usefully say here.
        { type: "otp", name: "code", label: "Code", length: 6, autocomplete: "off" },
      ],
    };
    render(<FormRenderer config={config} onSubmit={async () => undefined} />);

    expect(autocompleteOf("Full name")).toBe("name");
    expect(autocompleteOf("Email")).toBe("email");
    expect(autocompleteOf("Password")).toBe("new-password");
    expect(autocompleteOf("Street")).toBe("street-address");
    expect(autocompleteOf("Birth year")).toBe("bday-year");
    expect(autocompleteOf("Card")).toBe("cc-number");
    expect(autocompleteOf("Slot")).toBe("off");
    expect(autocompleteOf("Phone")).toBe("mobile tel");
    expect(autocompleteOf("Code")).toBe("off");
  });

  it("leaves the library defaults alone when the config sets nothing", () => {
    // phone and otp are the two controls that already ship a token of their own
    // — react-phone-number-input defaults to "tel", input-otp to
    // "one-time-code". Forwarding an absent value as an explicit `undefined`
    // would strip both, turning an additive prop into a regression on every
    // config that does not use it.
    const config: FormConfig = {
      id: "ac-defaults",
      fields: [
        { type: "phone", name: "phone", label: "Phone" },
        { type: "otp", name: "code", label: "Code", length: 6 },
      ],
    };
    render(<FormRenderer config={config} onSubmit={async () => undefined} />);

    expect(autocompleteOf("Phone")).toBe("tel");
    expect(autocompleteOf("Code")).toBe("one-time-code");
  });

  it("puts no attribute on a text input that does not ask for one", () => {
    const config: FormConfig = {
      id: "ac-absent",
      fields: [{ type: "text", name: "nickname", label: "Nickname" }],
    };
    render(<FormRenderer config={config} onSubmit={async () => undefined} />);

    expect(control("Nickname").hasAttribute("autocomplete")).toBe(false);
  });

  it("is inert, not fatal, on the types with no native input to carry it", () => {
    // date/select/country render a popover behind a <button>, and HTML ignores
    // the attribute on file/checkbox/radio. Setting it there is a no-op — worth
    // pinning, because "no-op" is the documented contract and the alternative
    // (a button carrying autocomplete="bday") would look like it worked.
    const config: FormConfig = {
      id: "ac-inert",
      fields: [
        { type: "date", name: "dob", label: "Date of birth", autocomplete: "bday" },
        { type: "country", name: "country", label: "Country", autocomplete: "country" },
        {
          type: "select",
          name: "state",
          label: "State",
          autocomplete: "address-level1",
          options: [{ label: "Berlin", value: "BE" }],
        },
        { type: "file", name: "doc", label: "Document", autocomplete: "photo" },
      ],
    };
    render(<FormRenderer config={config} onSubmit={async () => undefined} />);

    for (const label of ["Date of birth", "Country", "State"]) {
      expect(control(label).hasAttribute("autocomplete"), `${label} carries no autocomplete`).toBe(false);
    }
    expect(control("Document").hasAttribute("autocomplete")).toBe(false);
  });
});
