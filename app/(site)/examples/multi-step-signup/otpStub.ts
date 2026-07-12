/**
 * Demo-only stub handlers — this example has no real email backend. Same
 * pattern as the builder's own preview (components/builder/previewStubs.ts).
 */
export const DEMO_OTP = "123456";

/** No real channel in this demo; "sending" always succeeds. */
export async function sendOtpStub(): Promise<void> {
  // intentionally empty
}

/** Accepts only the full DEMO_OTP code. */
export async function verifyOtpStub(_fieldName: string, code: string): Promise<boolean> {
  return code === DEMO_OTP;
}
