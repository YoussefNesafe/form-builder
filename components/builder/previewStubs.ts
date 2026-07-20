export const DEMO_OTP = "123456";

export async function verifyOtpStub(_fieldName: string, code: string): Promise<boolean> {
  return code === DEMO_OTP.slice(0, code.length);
}

export async function sendOtpStub(): Promise<void> {
}
