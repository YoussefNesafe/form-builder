// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useOtpController, type UseOtpControllerOptions } from "./useOtpController";

describe("useOtpController", () => {
  it("returns no runtime when nothing is configured", () => {
    const { result } = renderHook(() => useOtpController({}));
    expect(result.current.otp).toBeUndefined();
    expect(result.current.hasVerify).toBe(false);
  });

  it("routes send/verify to the mapped per-field handlers", async () => {
    const emailSend = vi.fn().mockResolvedValue(undefined);
    const phoneSend = vi.fn().mockResolvedValue(undefined);
    const fields: UseOtpControllerOptions["fields"] = {
      emailOtp: { send: (values) => emailSend(values.email), verify: vi.fn().mockResolvedValue(true) },
      phoneOtp: { send: (values) => phoneSend(values.phone), verify: vi.fn().mockResolvedValue(true) },
    };
    const { result } = renderHook(() => useOtpController({ fields }));

    await act(() => result.current.otp!.send!("emailOtp", { email: "a@b.com", phone: "+9715" }));
    expect(emailSend).toHaveBeenCalledWith("a@b.com");
    expect(phoneSend).not.toHaveBeenCalled();

    await act(() => result.current.otp!.send!("phoneOtp", { email: "a@b.com", phone: "+9715" }));
    expect(phoneSend).toHaveBeenCalledWith("+9715");
  });

  it("falls back to the fieldName-branched handlers for unmapped fields", async () => {
    const send = vi.fn().mockResolvedValue(undefined);
    const verify = vi.fn().mockResolvedValue(true);
    const { result } = renderHook(() => useOtpController({ fallback: { send, verify } }));

    await act(() => result.current.otp!.send!("anyOtp", { x: 1 }));
    expect(send).toHaveBeenCalledWith("anyOtp", { x: 1 });
    await act(() => result.current.otp!.verify!("anyOtp", "1234"));
    expect(verify).toHaveBeenCalledWith("anyOtp", "1234");
  });

  it("rejects with a descriptive error when a field has no handler", async () => {
    const fields: UseOtpControllerOptions["fields"] = {
      emailOtp: { send: vi.fn().mockResolvedValue(undefined) },
    };
    const { result } = renderHook(() => useOtpController({ fields }));
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(result.current.otp!.send!("ghostOtp", {})).rejects.toThrow(/no send handler/);
    spy.mockRestore();
  });

  it("records verified codes with the dep snapshot and invalidates them", async () => {
    const fields: UseOtpControllerOptions["fields"] = {
      code: { verify: vi.fn().mockImplementation((c: string) => Promise.resolve(c === "1234")) },
    };
    const { result } = renderHook(() => useOtpController({ fields }));
    expect(result.current.hasVerify).toBe(true);

    await act(async () => {
      await result.current.otp!.verify!("code", "9999", "+971A");
    });
    expect(result.current.verifiedFields.has("code")).toBe(false);
    expect(result.current.otpVerified("code", "9999")).toBe(false);

    await act(async () => {
      await result.current.otp!.verify!("code", "1234", "+971A");
    });
    expect(result.current.verifiedFields.has("code")).toBe(true);
    expect(result.current.otpVerified("code", "1234")).toBe(true);
    // Editing the code re-invalidates via value compare.
    expect(result.current.otpVerified("code", "1235")).toBe(false);
    // Dep snapshot: same dep matches, different dep does not.
    expect(result.current.otp!.isVerifiedFor!("code", "+971A")).toBe(true);
    expect(result.current.otp!.isVerifiedFor!("code", "+971B")).toBe(false);

    act(() => result.current.otp!.invalidate!("code"));
    expect(result.current.verifiedFields.has("code")).toBe(false);
    expect(result.current.otpVerified("code", "1234")).toBe(false);
    // Empty registry counts as matching any dep (nothing stale to protect).
    expect(result.current.otp!.isVerifiedFor!("code", "+971B")).toBe(true);
  });
});
