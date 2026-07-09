/** Demo verification code for the preview; the first N chars of this per length. */
export const DEMO_OTP = "123456";

/** Accepts the length-appropriate prefix of DEMO_OTP (e.g. "1234" for length 4). */
export async function verifyOtpStub(_fieldName: string, code: string): Promise<boolean> {
  return code === DEMO_OTP.slice(0, code.length);
}

/** No-op send: in preview there is no real channel, so "sending" always succeeds. */
export async function sendOtpStub(): Promise<void> {
  // intentionally empty
}
