// @vitest-environment jsdom
import { useEffect, useState } from "react";
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

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.ResizeObserver = window.ResizeObserver ?? (ResizeObserverStub as typeof ResizeObserver);

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

    await act(async () => {
      fireEvent.change(screen.getByLabelText("Email"), { target: { value: "new@mail.co" } });
    });
    await waitFor(() => expect(screen.queryByText("Email already registered")).toBeNull());

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

    await waitFor(() => expect(screen.getByLabelText("Second")).toBeTruthy());
    expect(document.querySelector('[aria-current="step"]')?.textContent).toContain("Two");

    await act(async () => {
      fireEvent.submit(screen.getByRole("button", { name: "Go" }).closest("form")!);
    });
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0][0]).toMatchObject({ first: "from draft" });
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
    expect((screen.getByLabelText("Billing") as HTMLInputElement).value).toBe("my own address");

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

    expect(screen.queryByText("Extras")).toBeNull();
    expect(screen.getByText("Finish")).toBeTruthy();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Next" }));
    });
    expect(screen.getByLabelText("Final")).toBeTruthy();
    expect(document.querySelector('[aria-current="step"]')?.textContent).toContain("Finish");

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

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Back" }));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("checkbox"));
    });
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
    const formRef: { current?: UseFormReturn } = {};
    function StepperHarness() {
      const f = useForm({ defaultValues: buildDefaultValues(conditionalConfig.fields) });
      // Published in an effect, not during render: react-hooks/globals (the
      // React Compiler-backed rule) rightly rejects writing to a variable from
      // an enclosing scope while rendering.
      useEffect(() => {
        formRef.current = f;
      }, [f]);
      return (
        <FormProvider {...f}>
          <FieldRuntimeContext.Provider value={{ disabled: false, messages: defaultMessages }}>
            <FormStepper config={conditionalConfig} />
          </FieldRuntimeContext.Provider>
        </FormProvider>
      );
    }
    render(<StepperHarness />);

    await act(async () => formRef.current!.setValue("wantsExtras", true));
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Next" }));
    });
    expect(document.querySelector('[aria-current="step"]')?.textContent).toContain("Extras");

    await act(async () => formRef.current!.setValue("wantsExtras", false));
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
    expect(document.querySelector('[aria-current="step"]')?.textContent).toContain("Review");

    expect(screen.getByText("Grace")).toBeTruthy();
    expect(screen.queryByText("Extra detail")).toBeNull();
    expect(screen.queryByText("Nickname")).toBeNull();
    expect(screen.getByText("Extras?")).toBeTruthy();
    expect(screen.getByText(defaultMessages.no)).toBeTruthy();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Edit: About" }));
    });
    expect(document.querySelector('[aria-current="step"]')?.textContent).toContain("About");

    await act(async () => {
      fireEvent.change(screen.getByLabelText("First name"), { target: { value: "Ada" } });
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Next" }));
    });
    expect(screen.getByText("Ada")).toBeTruthy();
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

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Next" }));
    });
    await act(async () => {
      fireEvent.submit(screen.getByRole("button", { name: "Go" }).closest("form")!);
    });

    await waitFor(() => expect(screen.getByLabelText("First")).toBeTruthy());
    expect(screen.getByText("Rejected upstream")).toBeTruthy();
    const currentStep = document.querySelector('[aria-current="step"]');
    expect(currentStep?.textContent).toContain("One");
  });
});

const wizardConfig: FormConfig = {
  id: "controlled-wizard",
  fields: [
    { type: "text", name: "first", label: "First" },
    { type: "text", name: "second", label: "Second" },
    { type: "text", name: "third", label: "Third" },
    { type: "submit", name: "go", text: "Go" },
  ],
  steps: [
    { title: "One", fieldNames: ["first"] },
    { title: "Two", fieldNames: ["second"] },
    { title: "Three", fieldNames: ["third"] },
  ],
};

const conditionalWizardConfig: FormConfig = {
  id: "controlled-cond-wizard",
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

const currentStepText = () => document.querySelector('[aria-current="step"]')?.textContent ?? "";

async function click(name: string) {
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name }));
  });
}

/** Stands in for a host that mirrors the step into its router: it feeds every
 *  reported step straight back in as the controlled `step` prop. `follow: false`
 *  models a host that ignores the callback entirely. */
function RouterLikeHost({
  config = wizardConfig,
  initialStep = 0,
  follow = true,
  spy,
}: {
  config?: FormConfig;
  initialStep?: number;
  follow?: boolean;
  spy?: (step: number) => void;
}) {
  const [step, setStep] = useState(initialStep);
  return (
    <FormRenderer
      config={config}
      onSubmit={vi.fn()}
      step={step}
      onStepChange={(next) => {
        spy?.(next);
        if (follow) setStep(next);
      }}
    />
  );
}

describe("FormRenderer step control", () => {
  it("uncontrolled: Next/Back still drive the stepper with no step props supplied", async () => {
    render(<FormRenderer config={wizardConfig} onSubmit={vi.fn()} />);

    expect(currentStepText()).toContain("One");
    await click("Next");
    expect(currentStepText()).toContain("Two");
    expect(screen.getByLabelText("Second")).toBeTruthy();
    await click("Back");
    expect(currentStepText()).toContain("One");
    expect(screen.getByLabelText("First")).toBeTruthy();
  });

  it("onStepChange stays silent on mount and reports every step the wizard lands on", async () => {
    const onStepChange = vi.fn();
    render(<FormRenderer config={wizardConfig} onSubmit={vi.fn()} onStepChange={onStepChange} />);

    expect(onStepChange).not.toHaveBeenCalled();

    await click("Next");
    expect(onStepChange.mock.calls).toEqual([[1]]);
    await click("Next");
    await click("Back");
    expect(onStepChange.mock.calls).toEqual([[1], [2], [1]]);
  });

  it("controlled: mounts on the named step without reporting it back", () => {
    const spy = vi.fn();
    render(<RouterLikeHost initialStep={1} spy={spy} />);

    expect(currentStepText()).toContain("Two");
    expect(screen.getByLabelText("Second")).toBeTruthy();
    expect(spy).not.toHaveBeenCalled();
  });

  it("controlled: a new step prop moves the wizard, and moving there is not reported back", () => {
    const spy = vi.fn();
    const { rerender } = render(
      <FormRenderer config={wizardConfig} onSubmit={vi.fn()} step={0} onStepChange={spy} />,
    );
    expect(currentStepText()).toContain("One");

    rerender(<FormRenderer config={wizardConfig} onSubmit={vi.fn()} step={2} onStepChange={spy} />);
    expect(currentStepText()).toContain("Three");
    expect(screen.getByLabelText("Third")).toBeTruthy();
    expect(spy).not.toHaveBeenCalled();
  });

  it("controlled: Next advances locally and reports, so a host that ignores the callback is not stuck", async () => {
    const spy = vi.fn();
    render(<RouterLikeHost follow={false} spy={spy} />);

    await click("Next");
    expect(spy.mock.calls).toEqual([[1]]);
    expect(currentStepText()).toContain("Two");
    expect(screen.getByLabelText("Second")).toBeTruthy();
  });

  it("controlled: an out-of-range step clamps into range and reports where it actually landed", () => {
    const spy = vi.fn();
    render(<FormRenderer config={wizardConfig} onSubmit={vi.fn()} step={9} onStepChange={spy} />);

    expect(currentStepText()).toContain("Three");
    expect(spy.mock.calls).toEqual([[2]]);
  });

  it("controlled: a hidden step redirects to the nearest visible one and reports the correction", () => {
    const spy = vi.fn();
    render(
      <FormRenderer config={conditionalWizardConfig} onSubmit={vi.fn()} step={1} onStepChange={spy} />,
    );

    expect(currentStepText()).toContain("Finish");
    expect(spy.mock.calls).toEqual([[2]]);
  });

  it("composes the consumer callback with autosave's own step bookkeeping", async () => {
    window.localStorage.clear();
    const spy = vi.fn();
    render(
      <FormRenderer
        config={wizardConfig}
        onSubmit={vi.fn()}
        autosave={{ key: "compose-steps", debounceMs: 0 }}
        onStepChange={spy}
      />,
    );

    // A step is only persisted onto an existing draft, so give it one first.
    await act(async () => {
      fireEvent.change(screen.getByLabelText("First"), { target: { value: "typed" } });
    });
    await waitFor(() =>
      expect(window.localStorage.getItem("form-builder:draft:compose-steps")).not.toBeNull(),
    );

    await click("Next");
    expect(spy.mock.calls).toEqual([[1]]);
    const raw = window.localStorage.getItem("form-builder:draft:compose-steps");
    expect((JSON.parse(raw!) as { step?: number }).step).toBe(1);
  });
});

describe("FormRenderer stepper orientation", () => {
  it("defaults to a horizontal step list", () => {
    render(<FormRenderer config={wizardConfig} onSubmit={vi.fn()} />);
    expect(document.querySelector("ol")?.getAttribute("data-orientation")).toBe("horizontal");
  });

  it("vertical keeps the list semantics, aria-current and the focus move on step change", async () => {
    render(<FormRenderer config={wizardConfig} onSubmit={vi.fn()} stepperOrientation="vertical" />);

    const list = document.querySelector("ol")!;
    expect(list.getAttribute("data-orientation")).toBe("vertical");
    expect(list.getAttribute("aria-label")).toBe(defaultMessages.steps);
    expect(list.querySelectorAll("li")).toHaveLength(3);
    expect(currentStepText()).toContain("One");

    await click("Next");
    expect(currentStepText()).toContain("Two");
    expect(document.activeElement).toBe(list);
  });
});

describe("FormRenderer onDraftRestore", () => {
  async function seedDraft(key: string, values: Record<string, unknown>, step?: number) {
    const { draftConfigHash } = await import("../core/autosave");
    window.localStorage.setItem(
      `form-builder:draft:${key}`,
      JSON.stringify({ hash: draftConfigHash(wizardConfig.fields), values, step }),
    );
  }

  it("fires once with the restored step, and not again as the user moves", async () => {
    window.localStorage.clear();
    await seedDraft("restore-with-step", { first: "from draft" }, 1);
    const onDraftRestore = vi.fn();
    render(
      <FormRenderer
        config={wizardConfig}
        onSubmit={vi.fn()}
        autosave={{ key: "restore-with-step", debounceMs: 0 }}
        onDraftRestore={onDraftRestore}
      />,
    );

    await waitFor(() => expect(onDraftRestore).toHaveBeenCalledTimes(1));
    expect(onDraftRestore).toHaveBeenCalledWith({ step: 1 });
    expect(currentStepText()).toContain("Two");

    await click("Next");
    await click("Back");
    expect(onDraftRestore).toHaveBeenCalledTimes(1);
  });

  it("fires with an undefined step when the restored draft carried none", async () => {
    window.localStorage.clear();
    await seedDraft("restore-no-step", { first: "from draft" });
    const onDraftRestore = vi.fn();
    render(
      <FormRenderer
        config={wizardConfig}
        onSubmit={vi.fn()}
        autosave={{ key: "restore-no-step", debounceMs: 0 }}
        onDraftRestore={onDraftRestore}
      />,
    );

    await waitFor(() =>
      expect((screen.getByLabelText("First") as HTMLInputElement).value).toBe("from draft"),
    );
    expect(onDraftRestore).toHaveBeenCalledTimes(1);
    expect(onDraftRestore).toHaveBeenCalledWith({ step: undefined });
    expect(currentStepText()).toContain("One");
  });

  it("does not fire when there is nothing stored, nor when autosave is off", async () => {
    window.localStorage.clear();
    const fresh = vi.fn();
    const { unmount } = render(
      <FormRenderer
        config={wizardConfig}
        onSubmit={vi.fn()}
        autosave={{ key: "restore-absent", debounceMs: 0 }}
        onDraftRestore={fresh}
      />,
    );
    await click("Next");
    expect(fresh).not.toHaveBeenCalled();
    unmount();

    window.localStorage.clear();
    const noAutosave = vi.fn();
    render(<FormRenderer config={wizardConfig} onSubmit={vi.fn()} onDraftRestore={noAutosave} />);
    await click("Next");
    expect(noAutosave).not.toHaveBeenCalled();
  });

  it("does not fire for a draft whose config hash no longer matches", async () => {
    window.localStorage.clear();
    window.localStorage.setItem(
      "form-builder:draft:restore-stale",
      JSON.stringify({ hash: "not-the-current-hash", values: { first: "stale" }, step: 2 }),
    );
    const onDraftRestore = vi.fn();
    render(
      <FormRenderer
        config={wizardConfig}
        onSubmit={vi.fn()}
        autosave={{ key: "restore-stale", debounceMs: 0 }}
        onDraftRestore={onDraftRestore}
      />,
    );

    await click("Next");
    expect(onDraftRestore).not.toHaveBeenCalled();
  });

  it("reports each restore when the draft key changes, without carrying the previous step over", async () => {
    window.localStorage.clear();
    await seedDraft("key-a", { first: "a" }, 2);
    await seedDraft("key-b", { first: "b" });
    const onDraftRestore = vi.fn();

    const { rerender } = render(
      <FormRenderer
        config={wizardConfig}
        onSubmit={vi.fn()}
        autosave={{ key: "key-a", debounceMs: 0 }}
        onDraftRestore={onDraftRestore}
      />,
    );
    await waitFor(() => expect(onDraftRestore).toHaveBeenCalledTimes(1));
    expect(onDraftRestore).toHaveBeenLastCalledWith({ step: 2 });

    rerender(
      <FormRenderer
        config={wizardConfig}
        onSubmit={vi.fn()}
        autosave={{ key: "key-b", debounceMs: 0 }}
        onDraftRestore={onDraftRestore}
      />,
    );
    await waitFor(() => expect(onDraftRestore).toHaveBeenCalledTimes(2));
    expect(onDraftRestore).toHaveBeenLastCalledWith({ step: undefined });
  });
});
