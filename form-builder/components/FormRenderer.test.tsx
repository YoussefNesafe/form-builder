// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FormProvider, useForm, type UseFormReturn } from "react-hook-form";
import { registerBuiltInFields } from "../fields";
import { defaultMessages } from "../core/messages";
import type { FormConfig } from "../core/types";
import { buildDefaultValues } from "../core/defaults";
import { FieldRuntimeContext } from "./FieldRuntime";
import { FormRenderer } from "./FormRenderer";
import { FormStepper } from "./FormStepper";

registerBuiltInFields();
afterEach(cleanup);

// Some field primitives observe size; jsdom has no ResizeObserver.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.ResizeObserver = window.ResizeObserver ?? (ResizeObserverStub as typeof ResizeObserver);

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

  it("clears the root error even when the resubmit is blocked by client validation", async () => {
    const onSubmit = vi
      .fn()
      .mockResolvedValueOnce({ formError: "Server said no" })
      .mockResolvedValue(undefined);
    render(<FormRenderer config={config} onSubmit={onSubmit} />);

    await clickWhenEnabled("Go");
    await waitFor(() => expect(screen.getByText("Server said no")).toBeTruthy());

    // Break client validation, then resubmit the form directly (the submit
    // button gates on isValid): the ATTEMPT must clear the stale formError
    // even though onSubmit never runs.
    await act(async () => {
      fireEvent.change(screen.getByLabelText("Email"), { target: { value: "not-an-email" } });
    });
    await act(async () => {
      fireEvent.submit(screen.getByRole("button", { name: "Go" }).closest("form")!);
    });
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("Server said no")).toBeNull();
  });

  it("autosave: restores the persisted step and clears the draft on clean submit", async () => {
    window.localStorage.clear();
    const { draftConfigHash } = await import("../core/autosave");
    const steppedConfig: FormConfig = {
      id: "draft-wizard",
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
    window.localStorage.setItem(
      "form-builder:draft:draft-wizard",
      JSON.stringify({
        hash: draftConfigHash(steppedConfig.fields),
        values: { first: "from draft", second: "" },
        step: 1,
      }),
    );
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<FormRenderer config={steppedConfig} onSubmit={onSubmit} autosave={{ debounceMs: 0 }} />);

    // Restored onto step Two with the drafted value in form state.
    await waitFor(() => expect(screen.getByLabelText("Second")).toBeTruthy());
    expect(document.querySelector('[aria-current="step"]')?.textContent).toContain("Two");

    await act(async () => {
      fireEvent.submit(screen.getByRole("button", { name: "Go" }).closest("form")!);
    });
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0][0]).toMatchObject({ first: "from draft" });
    // Clean submit → draft gone.
    await waitFor(() => expect(window.localStorage.getItem("form-builder:draft:draft-wizard")).toBeNull());
  });

  it("autosave restore does not clobber a drafted copyFrom override (re-baseline, not mirror)", async () => {
    window.localStorage.clear();
    const { draftConfigHash } = await import("../core/autosave");
    const copyConfig: FormConfig = {
      id: "copy-draft",
      fields: [
        { type: "text", name: "shipping", label: "Shipping" },
        { type: "text", name: "billing", label: "Billing", copyFrom: "shipping" },
        { type: "submit", name: "go", text: "Go" },
      ],
    };
    // The user had overridden billing before the draft was saved.
    window.localStorage.setItem(
      "form-builder:draft:copy-draft",
      JSON.stringify({
        hash: draftConfigHash(copyConfig.fields),
        values: { shipping: "12 Main St", billing: "my own address" },
      }),
    );
    render(<FormRenderer config={copyConfig} onSubmit={vi.fn()} autosave={{ debounceMs: 0 }} />);

    await waitFor(() =>
      expect((screen.getByLabelText("Shipping") as HTMLInputElement).value).toBe("12 Main St"),
    );
    // Without the restore-generation re-baseline the sync hook would treat
    // the restore as a source edit and mirror shipping into billing.
    expect((screen.getByLabelText("Billing") as HTMLInputElement).value).toBe("my own address");

    // The sync still works for REAL source edits after the restore.
    await act(async () => {
      fireEvent.change(screen.getByLabelText("Shipping"), { target: { value: "99 New Rd" } });
    });
    await waitFor(() =>
      expect((screen.getByLabelText("Billing") as HTMLInputElement).value).toBe("99 New Rd"),
    );
  });

  it("copyFrom chains propagate hop by hop (C → B → A)", async () => {
    const chainConfig: FormConfig = {
      id: "chain",
      fields: [
        { type: "text", name: "c", label: "C" },
        { type: "text", name: "b", label: "B", copyFrom: "c" },
        { type: "text", name: "a", label: "A", copyFrom: "b" },
        { type: "submit", name: "go", text: "Go" },
      ],
    };
    render(<FormRenderer config={chainConfig} onSubmit={vi.fn()} />);
    await act(async () => {
      fireEvent.change(screen.getByLabelText("C"), { target: { value: "origin" } });
    });
    await waitFor(() => expect((screen.getByLabelText("B") as HTMLInputElement).value).toBe("origin"));
    await waitFor(() => expect((screen.getByLabelText("A") as HTMLInputElement).value).toBe("origin"));
  });

  it("conditional steps: hidden step leaves the dots and Next skips it; appears when its condition matches", async () => {
    const conditionalConfig: FormConfig = {
      id: "cond-steps",
      fields: [
        { type: "checkbox", name: "wantsExtras", label: "Extras?" },
        { type: "text", name: "extra", label: "Extra" },
        { type: "text", name: "final", label: "Final" },
        { type: "submit", name: "go", text: "Go" },
      ],
      steps: [
        { title: "Base", fieldNames: ["wantsExtras"] },
        { title: "Extras", fieldNames: ["extra"], visibleWhen: { field: "wantsExtras", equals: true } },
        { title: "Finish", fieldNames: ["final"] },
      ],
    };
    render(<FormRenderer config={conditionalConfig} onSubmit={vi.fn()} />);

    // Condition false: the Extras dot is not rendered, numbering compacts.
    expect(screen.queryByText("Extras")).toBeNull();
    expect(screen.getByText("Finish")).toBeTruthy();

    // Next skips straight to Finish.
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Next" }));
    });
    expect(screen.getByLabelText("Final")).toBeTruthy();
    expect(document.querySelector('[aria-current="step"]')?.textContent).toContain("Finish");

    // Back returns to Base; enabling the condition reveals the step.
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Back" }));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("checkbox"));
    });
    expect(screen.getByText("Extras")).toBeTruthy();
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Next" }));
    });
    expect(screen.getByLabelText("Extra")).toBeTruthy();
    expect(document.querySelector('[aria-current="step"]')?.textContent).toContain("Extras");
  });

  it("conditional steps: the current step disappearing moves the user to the nearest visible step", async () => {
    const conditionalConfig: FormConfig = {
      id: "cond-steps-2",
      fields: [
        { type: "checkbox", name: "wantsExtras", label: "Extras?" },
        { type: "text", name: "extra", label: "Extra" },
        { type: "text", name: "final", label: "Final" },
        { type: "submit", name: "go", text: "Go" },
      ],
      steps: [
        { title: "Base", fieldNames: ["wantsExtras"] },
        { title: "Extras", fieldNames: ["extra"], visibleWhen: { field: "wantsExtras", equals: true } },
        { title: "Finish", fieldNames: ["final"] },
      ],
    };
    render(<FormRenderer config={conditionalConfig} onSubmit={vi.fn()} />);

    await act(async () => {
      fireEvent.click(screen.getByRole("checkbox"));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Next" }));
    });
    expect(document.querySelector('[aria-current="step"]')?.textContent).toContain("Extras");

    // Un-checking from... the source is on step Base; simulate the condition
    // flipping while standing ON the Extras step via the hidden checkbox not
    // being rendered — instead navigate back, uncheck, forward:
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Back" }));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("checkbox"));
    });
    // Extras gone again; Next lands on Finish.
    expect(screen.queryByText("Extras")).toBeNull();
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Next" }));
    });
    expect(document.querySelector('[aria-current="step"]')?.textContent).toContain("Finish");
  });

  it("conditional steps: the current step hiding UNDER the user bounces to the nearest visible step", async () => {
    const conditionalConfig: FormConfig = {
      id: "cond-bounce",
      fields: [
        { type: "checkbox", name: "wantsExtras", label: "Extras?" },
        { type: "text", name: "extra", label: "Extra" },
        { type: "text", name: "final", label: "Final" },
      ],
      steps: [
        { title: "Base", fieldNames: ["wantsExtras"] },
        { title: "Extras", fieldNames: ["extra"], visibleWhen: { field: "wantsExtras", equals: true } },
        { title: "Finish", fieldNames: ["final"] },
      ],
    };
    let form: UseFormReturn | undefined;
    function StepperHarness() {
      const f = useForm({ defaultValues: buildDefaultValues(conditionalConfig.fields) });
      form = f;
      return (
        <FormProvider {...f}>
          <FieldRuntimeContext.Provider value={{ disabled: false, messages: defaultMessages }}>
            <FormStepper config={conditionalConfig} />
          </FieldRuntimeContext.Provider>
        </FormProvider>
      );
    }
    render(<StepperHarness />);

    // Walk onto the conditional step.
    await act(async () => form!.setValue("wantsExtras", true));
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Next" }));
    });
    expect(document.querySelector('[aria-current="step"]')?.textContent).toContain("Extras");

    // Flip the source PROGRAMMATICALLY while standing on it (cross-step
    // copyFrom / host setValue class) — the stepper must bounce to the
    // nearest visible step (next preferred: Finish).
    await act(async () => form!.setValue("wantsExtras", false));
    expect(document.querySelector('[aria-current="step"]')?.textContent).toContain("Finish");
    expect(screen.getByLabelText("Final")).toBeTruthy();
  });

  it("review step: summarizes earlier visible steps with live values and per-step edit links", async () => {
    const reviewConfig: FormConfig = {
      id: "review-wizard",
      fields: [
        { type: "text", name: "firstName", label: "First name" },
        { type: "checkbox", name: "wantsExtras", label: "Extras?" },
        { type: "text", name: "extra", label: "Extra detail" },
        { type: "text", name: "nickname", label: "Nickname", visibleWhen: { field: "firstName", equals: "Ada" } },
        { type: "submit", name: "go", text: "Go" },
      ],
      steps: [
        { title: "About", fieldNames: ["firstName", "nickname", "wantsExtras"] },
        { title: "Extras", fieldNames: ["extra"], visibleWhen: { field: "wantsExtras", equals: true } },
        { title: "Review", review: true },
      ],
    };
    render(<FormRenderer config={reviewConfig} onSubmit={vi.fn()} />);

    await act(async () => {
      fireEvent.change(screen.getByLabelText("First name"), { target: { value: "Grace" } });
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Next" }));
    });
    // Extras step is hidden (checkbox off) — landed straight on Review.
    expect(document.querySelector('[aria-current="step"]')?.textContent).toContain("Review");

    // Summary shows About's values; the hidden Extras section and the
    // condition-hidden nickname row are absent.
    expect(screen.getByText("Grace")).toBeTruthy();
    expect(screen.queryByText("Extra detail")).toBeNull();
    expect(screen.queryByText("Nickname")).toBeNull();
    expect(screen.getByText("Extras?")).toBeTruthy();
    expect(screen.getByText(defaultMessages.no)).toBeTruthy();

    // Edit link jumps back to the owning step.
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Edit: About" }));
    });
    expect(document.querySelector('[aria-current="step"]')?.textContent).toContain("About");

    // Values edited after the fact show live on return.
    await act(async () => {
      fireEvent.change(screen.getByLabelText("First name"), { target: { value: "Ada" } });
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Next" }));
    });
    expect(screen.getByText("Ada")).toBeTruthy();
    // Nickname became visible (own condition) — row appears, unanswered.
    expect(screen.getByText("Nickname")).toBeTruthy();
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
