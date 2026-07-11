// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { registerBuiltInFields } from "../fields";
import type { FormConfig } from "../core/types";
import { FormRenderer } from "./FormRenderer";

registerBuiltInFields();
afterEach(cleanup);

// Submit buttons gate on formState.isValid, which the resolver computes
// asynchronously after mount — wait for the gate to open before clicking.
async function clickWhenEnabled(name: string) {
  const button = screen.getByRole("button", { name }) as HTMLButtonElement;
  await waitFor(() => expect(button.disabled).toBe(false));
  await act(async () => {
    fireEvent.click(button);
  });
}

const config: FormConfig = {
  id: "signup",
  fields: [
    { type: "text", name: "username", label: "Username" },
    { type: "email", name: "email", label: "Email" },
    { type: "submit", name: "go", text: "Go" },
  ],
};

describe("FormRenderer server errors", () => {
  it("maps fieldErrors onto fields, renders formError, focuses the first errored field", async () => {
    const onSubmit = vi.fn().mockResolvedValue({
      fieldErrors: { email: "Email already registered", ghost: "No such field" },
      formError: "Fix the errors below",
    });
    render(<FormRenderer config={config} onSubmit={onSubmit} />);

    await clickWhenEnabled("Go");

    expect(onSubmit).toHaveBeenCalled();
    await waitFor(() => expect(screen.getByText("Email already registered")).toBeTruthy());
    // Field errors are alerts too — assert the root slot by its merged text.
    expect(screen.getByText("Fix the errors below; No such field")).toBeTruthy();
    await waitFor(() => expect(document.activeElement).toBe(screen.getByLabelText("Email")));
  });

  it("clears the server error when the field changes, and the root error on resubmit", async () => {
    const onSubmit = vi
      .fn()
      .mockResolvedValueOnce({ fieldErrors: { email: "Email already registered" }, formError: "Nope" })
      .mockResolvedValueOnce(undefined);
    render(<FormRenderer config={config} onSubmit={onSubmit} />);

    await clickWhenEnabled("Go");
    await waitFor(() => expect(screen.getByText("Email already registered")).toBeTruthy());

    // Changing the errored field revalidates it — the server error goes.
    await act(async () => {
      fireEvent.change(screen.getByLabelText("Email"), { target: { value: "new@mail.co" } });
    });
    await waitFor(() => expect(screen.queryByText("Email already registered")).toBeNull());

    // Root error clears on the next submit attempt.
    await clickWhenEnabled("Go");
    await waitFor(() => expect(screen.queryByText("Nope")).toBeNull());
  });

  it("jumps the stepper to the step containing the first errored field", async () => {
    const steppedConfig: FormConfig = {
      id: "wizard",
      fields: [
        { type: "text", name: "first", label: "First" },
        { type: "text", name: "second", label: "Second" },
        { type: "submit", name: "go", text: "Go" },
      ],
      steps: [
        { title: "One", fieldNames: ["first"] },
        { title: "Two", fieldNames: ["second"] },
      ],
    };
    const onSubmit = vi.fn().mockResolvedValue({ fieldErrors: { first: "Rejected upstream" } });
    render(<FormRenderer config={steppedConfig} onSubmit={onSubmit} />);

    // Walk to the last step, then submit the FORM directly: a late-mounted
    // submit button's isValid gate lags in jsdom (pre-existing trait, not
    // under test here) — the subject is the server-error step jump.
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Next" }));
    });
    await act(async () => {
      fireEvent.submit(screen.getByRole("button", { name: "Go" }).closest("form")!);
    });

    // Back on step One with the server error visible.
    await waitFor(() => expect(screen.getByLabelText("First")).toBeTruthy());
    expect(screen.getByText("Rejected upstream")).toBeTruthy();
    const currentStep = document.querySelector('[aria-current="step"]');
    expect(currentStep?.textContent).toContain("One");
  });
});
