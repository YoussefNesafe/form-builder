// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { FormProvider, useForm, type UseFormReturn } from "react-hook-form";
import { defaultMessages } from "../core/messages";
import { FieldRuntimeContext } from "../components/FieldRuntime";
import type { FieldConfig } from "../core/types";

const { listeners, padMock, padConstructor } = vi.hoisted(() => {
  const listeners = new Map<string, () => void>();
  const padMock = {
    addEventListener: vi.fn((type: string, handler: () => void) => listeners.set(type, handler)),
    removeEventListener: vi.fn((type: string) => listeners.delete(type)),
    toDataURL: vi.fn(() => "data:image/png;base64,MOCK"),
    toData: vi.fn(() => []),
    fromData: vi.fn(),
    fromDataURL: vi.fn(() => Promise.resolve()),
    isEmpty: vi.fn(() => false),
    clear: vi.fn(),
    redraw: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  };
  const padConstructor = vi.fn();
  return { listeners, padMock, padConstructor };
});
vi.mock("signature_pad", () => ({
  default: function SignaturePadMock(this: unknown, ...args: unknown[]) {
    padConstructor(...args);
    return padMock;
  },
}));

import { SignatureField } from "./SignatureField";

type SignatureConfig = Extract<FieldConfig, { type: "signature" }>;

function Harness({
  field,
  defaultValues,
  onForm,
}: {
  field: SignatureConfig;
  defaultValues: Record<string, unknown>;
  onForm: (form: UseFormReturn) => void;
}) {
  const form = useForm({ defaultValues });
  onForm(form);
  return (
    <FormProvider {...form}>
      <FieldRuntimeContext.Provider value={{ disabled: false, messages: defaultMessages }}>
        <SignatureField field={field} />
      </FieldRuntimeContext.Provider>
    </FormProvider>
  );
}

const config: SignatureConfig = { type: "signature", name: "sign", label: "Signature" };

function setup(field: SignatureConfig = config, defaultValues: Record<string, unknown> = { sign: "" }) {
  let form!: UseFormReturn;
  render(<Harness field={field} defaultValues={defaultValues} onForm={(f) => (form = f)} />);
  return () => form;
}

describe("SignatureField", () => {
  beforeAll(() => {
    globalThis.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as unknown as typeof ResizeObserver;
  });

  beforeEach(() => {
    vi.clearAllMocks();
    listeners.clear();
  });

  afterEach(cleanup);

  it("renders a labeled canvas and a clear button", () => {
    setup();
    expect(screen.getByRole("img", { name: "Signature" })).toBeTruthy();
    expect(screen.getByRole("button", { name: defaultMessages.clearSignature })).toBeTruthy();
  });

  it("passes penColor to the pad", () => {
    setup({ ...config, penColor: "#1d4ed8" });
    expect(padConstructor).toHaveBeenCalledWith(expect.anything(), { penColor: "#1d4ed8" });
  });

  it("endStroke writes the data URL into form state and marks touched", async () => {
    const form = setup();
    await act(async () => listeners.get("endStroke")?.());
    expect(form().getValues("sign")).toBe("data:image/png;base64,MOCK");
    expect(form().getFieldState("sign").isTouched).toBe(true);
  });

  it("clear button wipes the pad and the value", async () => {
    const form = setup(config, { sign: "data:image/png;base64,OLD" });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: defaultMessages.clearSignature }));
    });
    expect(padMock.clear).toHaveBeenCalled();
    expect(form().getValues("sign")).toBe("");
  });

  it("external reset clears leftover ink", async () => {
    const form = setup(config, { sign: "data:image/png;base64,OLD" });
    padMock.clear.mockClear();
    await act(async () => form().setValue("sign", ""));
    expect(padMock.clear).toHaveBeenCalled();
  });

  it("restores a previously signed value on mount", () => {
    setup(config, { sign: "data:image/png;base64,OLD" });
    expect(padMock.fromDataURL).toHaveBeenCalledWith("data:image/png;base64,OLD");
  });

  it("disabled turns the pad off", () => {
    setup({ ...config, disabled: true });
    expect(padMock.off).toHaveBeenCalled();
  });

  it("resize path uses redraw (restored ink survives), not toData/fromData", () => {
    setup();
    expect(padMock.redraw).toHaveBeenCalled();
    expect(padMock.fromData).not.toHaveBeenCalled();
  });

  it("a non-empty value change does not clear the pad", async () => {
    const form = setup();
    padMock.clear.mockClear();
    await act(async () => form().setValue("sign", "data:image/png;base64,NEW"));
    expect(padMock.clear).not.toHaveBeenCalled();
  });

  it("unmount removes the endStroke listener and detaches the pad", () => {
    setup();
    cleanup();
    expect(padMock.removeEventListener).toHaveBeenCalledWith("endStroke", expect.any(Function));
    expect(padMock.off).toHaveBeenCalled();
  });

  it("renders error text with aria wiring on the canvas", async () => {
    const form = setup();
    await act(async () => form().setError("sign", { type: "manual", message: "boom" }));
    expect(screen.getByText("boom")).toBeTruthy();
    const canvas = screen.getByRole("img", { name: "Signature" });
    expect(canvas.className).toContain("border-destructive");
    const describedBy = canvas.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy!)?.textContent).toBe("boom");
  });
});
