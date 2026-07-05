// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FormProvider, useController, useForm, type UseFormReturn } from "react-hook-form";
import type { ReactNode } from "react";
import { FieldRuntimeContext } from "../components/FieldRuntime";
import { defaultMessages } from "../core/messages";
import { useOtpFlow } from "./useOtpFlow";

type Runtime = React.ContextType<typeof FieldRuntimeContext>;

// resetField only acts on REGISTERED fields — the real OtpField registers
// "code" through its Controller, so the harness must too.
function RegisterField({ name }: { name: string }) {
  useController({ name });
  return null;
}

function makeWrapper(runtime: Partial<Runtime>, formRef: { current?: UseFormReturn }) {
  return function Wrapper({ children }: { children: ReactNode }) {
    const form = useForm({ defaultValues: { code: "", phone: "" } as Record<string, unknown> });
    formRef.current = form;
    return (
      <FormProvider {...form}>
        <RegisterField name="code" />
        <FieldRuntimeContext.Provider
          value={{ disabled: false, messages: defaultMessages, ...runtime }}
        >
          {children}
        </FieldRuntimeContext.Provider>
      </FormProvider>
    );
  };
}

const config = { name: "code", length: 4, dependsOn: "phone" };

describe("useOtpFlow", () => {
  beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
  afterEach(() => vi.useRealTimers());

  it("send success moves to sent and counts down", async () => {
    const send = vi.fn().mockResolvedValue(undefined);
    const formRef: { current?: UseFormReturn } = {};
    const { result } = renderHook(() => useOtpFlow(config), {
      wrapper: makeWrapper({ otp: { send, verify: vi.fn() }, isFieldValid: () => true }, formRef),
    });

    await act(() => result.current.send());
    expect(result.current.status).toBe("sent");
    expect(result.current.seconds).toBe(30);

    await act(() => vi.advanceTimersByTimeAsync(2000));
    // shouldAdvanceTime can slip in an extra tick on slow runners.
    expect(result.current.seconds).toBeLessThanOrEqual(28);
    expect(result.current.seconds).toBeGreaterThan(0);
  });

  it("send failure from idle returns to idle with the send-failed error", async () => {
    const send = vi.fn().mockRejectedValue(new Error("boom"));
    const formRef: { current?: UseFormReturn } = {};
    const { result } = renderHook(() => useOtpFlow(config), {
      wrapper: makeWrapper({ otp: { send, verify: vi.fn() }, isFieldValid: () => true }, formRef),
    });

    await act(() => result.current.send());
    expect(result.current.status).toBe("idle");
    expect(result.current.error).toBe(defaultMessages.otpSendFailed);
  });

  it("a failed RESEND stays in sent — inputs remain usable", async () => {
    const send = vi.fn().mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error("boom"));
    const formRef: { current?: UseFormReturn } = {};
    const { result } = renderHook(() => useOtpFlow(config), {
      wrapper: makeWrapper({ otp: { send, verify: vi.fn() }, isFieldValid: () => true }, formRef),
    });

    await act(() => result.current.send());
    await act(() => vi.advanceTimersByTimeAsync(30_000));
    await act(() => result.current.send()); // resend fails
    expect(result.current.status).toBe("sent");
    expect(result.current.error).toBe(defaultMessages.otpSendFailed);
    expect(result.current.inputsDisabled).toBe(false);
  });

  it("auto-verifies a full code and does not retry the same rejected code", async () => {
    const send = vi.fn().mockResolvedValue(undefined);
    const verify = vi.fn().mockResolvedValue(false);
    const formRef: { current?: UseFormReturn } = {};
    const { result } = renderHook(() => useOtpFlow(config), {
      wrapper: makeWrapper({ otp: { send, verify }, isFieldValid: () => true }, formRef),
    });

    await act(() => result.current.send());
    act(() => formRef.current!.setValue("code", "1111"));
    await waitFor(() => expect(result.current.error).toBe(defaultMessages.otpVerifyFailed));
    expect(result.current.status).toBe("sent");
    expect(verify).toHaveBeenCalledTimes(1);

    // Attempted guard: the effect re-fires on verifying→sent with the same
    // rejected code still present, yet verify is not called again.
    await act(() => vi.advanceTimersByTimeAsync(50));
    expect(verify).toHaveBeenCalledTimes(1);

    verify.mockResolvedValue(true);
    act(() => formRef.current!.setValue("code", "2222"));
    await waitFor(() => expect(result.current.status).toBe("verified"));
    expect(verify).toHaveBeenLastCalledWith("code", "2222", "");
  });

  it("dependency change resets the flow, clears the code, and invalidates", async () => {
    const send = vi.fn().mockResolvedValue(undefined);
    const invalidate = vi.fn();
    const formRef: { current?: UseFormReturn } = {};
    const { result } = renderHook(() => useOtpFlow(config), {
      wrapper: makeWrapper(
        { otp: { send, verify: vi.fn().mockResolvedValue(true), invalidate }, isFieldValid: () => true },
        formRef,
      ),
    });

    act(() => formRef.current!.setValue("phone", "+971501111111"));
    await act(() => result.current.send());
    act(() => formRef.current!.setValue("code", "1234"));
    await waitFor(() => expect(result.current.status).toBe("verified"));

    act(() => formRef.current!.setValue("phone", "+971502222222"));
    await waitFor(() => expect(result.current.status).toBe("idle"));
    expect(invalidate).toHaveBeenCalledWith("code");
    expect(formRef.current!.getValues("code")).toBe("");
  });

  it("does not re-verify a stale rejected code in the same commit as a dependency reset", async () => {
    const send = vi.fn().mockResolvedValue(undefined);
    const verify = vi.fn().mockResolvedValue(false);
    const invalidate = vi.fn();
    const formRef: { current?: UseFormReturn } = {};
    const { result } = renderHook(() => useOtpFlow(config), {
      wrapper: makeWrapper({ otp: { send, verify, invalidate }, isFieldValid: () => true }, formRef),
    });

    act(() => formRef.current!.setValue("phone", "+971501111111"));
    await act(() => result.current.send());
    act(() => formRef.current!.setValue("code", "1111"));
    await waitFor(() => expect(result.current.error).toBe(defaultMessages.otpVerifyFailed));
    expect(verify).toHaveBeenCalledTimes(1);

    // Dep change while the rejected code is still full: the reset commit's
    // stale-closure verify pass must NOT fire verify("1111") at the new dep.
    act(() => formRef.current!.setValue("phone", "+971502222222"));
    await waitFor(() => expect(result.current.status).toBe("idle"));
    await act(() => vi.advanceTimersByTimeAsync(50));
    expect(verify).toHaveBeenCalledTimes(1);
    expect(formRef.current!.getValues("code")).toBe("");

    // Flag consumed — the next legitimate flow still verifies.
    await act(() => result.current.send());
    verify.mockResolvedValue(true);
    act(() => formRef.current!.setValue("code", "2222"));
    await waitFor(() => expect(result.current.status).toBe("verified"));
    expect(verify).toHaveBeenCalledTimes(2);
  });

  it("drops an in-flight verify that resolves after the dependency changed", async () => {
    const send = vi.fn().mockResolvedValue(undefined);
    let resolveVerify: (ok: boolean) => void = () => {};
    const verify = vi.fn().mockImplementation(
      () => new Promise<boolean>((resolve) => (resolveVerify = resolve)),
    );
    const formRef: { current?: UseFormReturn } = {};
    const { result } = renderHook(() => useOtpFlow(config), {
      wrapper: makeWrapper({ otp: { send, verify, invalidate: vi.fn() }, isFieldValid: () => true }, formRef),
    });

    await act(() => result.current.send());
    act(() => formRef.current!.setValue("code", "1234"));
    await waitFor(() => expect(result.current.status).toBe("verifying"));

    act(() => formRef.current!.setValue("phone", "changed"));
    await waitFor(() => expect(result.current.status).toBe("idle"));

    await act(async () => {
      resolveVerify(true);
      await Promise.resolve();
    });
    expect(result.current.status).toBe("idle");
  });

  it("resend clears stale digits before sending a fresh code", async () => {
    const send = vi.fn().mockResolvedValue(undefined);
    const formRef: { current?: UseFormReturn } = {};
    const { result } = renderHook(() => useOtpFlow(config), {
      wrapper: makeWrapper({ otp: { send, verify: vi.fn().mockResolvedValue(false) }, isFieldValid: () => true }, formRef),
    });

    await act(() => result.current.send());
    act(() => formRef.current!.setValue("code", "9999"));
    await waitFor(() => expect(result.current.error).toBe(defaultMessages.otpVerifyFailed));

    await act(() => vi.advanceTimersByTimeAsync(30_000));
    expect(result.current.seconds).toBe(0);
    await act(() => result.current.send());
    expect(formRef.current!.getValues("code")).toBe("");
    expect(result.current.status).toBe("sent");
  });

  it("rehydrates as verified from the registry after a remount", () => {
    const formRef: { current?: UseFormReturn } = {};
    const { result } = renderHook(() => useOtpFlow(config), {
      wrapper: makeWrapper(
        {
          otp: { send: vi.fn(), verify: vi.fn(), isVerifiedFor: () => true },
          verifiedFields: new Set(["code"]),
          isFieldValid: () => true,
        },
        formRef,
      ),
    });
    expect(result.current.status).toBe("verified");
    expect(result.current.inputsDisabled).toBe(true);
  });

  it("re-locks on remount when the registry snapshot no longer matches the dependency", async () => {
    const invalidate = vi.fn();
    const formRef: { current?: UseFormReturn } = {};
    const { result } = renderHook(() => useOtpFlow(config), {
      wrapper: makeWrapper(
        {
          otp: { send: vi.fn(), verify: vi.fn(), invalidate, isVerifiedFor: () => false },
          verifiedFields: new Set(["code"]),
          isFieldValid: () => true,
        },
        formRef,
      ),
    });
    await waitFor(() => expect(result.current.status).toBe("idle"));
    expect(invalidate).toHaveBeenCalledWith("code");
  });

  it("canSend follows the dependency validity predicate", () => {
    const formRef: { current?: UseFormReturn } = {};
    const { result } = renderHook(() => useOtpFlow(config), {
      wrapper: makeWrapper(
        { otp: { send: vi.fn(), verify: vi.fn() }, isFieldValid: () => false },
        formRef,
      ),
    });
    expect(result.current.canSend).toBe(false);
  });
});
