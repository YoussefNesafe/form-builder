export type Messages = {
  required: string;
  email: string;
  minLength: (n: number) => string;
  maxLength: (n: number) => string;
  min: (n: number) => string;
  max: (n: number) => string;
  pattern: string;
  fileSize: (mb: number) => string;
  otpLength: (n: number) => string;
  invalidDate: string;
  showPassword: string;
  hidePassword: string;
};

export const defaultMessages: Messages = {
  required: "This field is required",
  email: "Enter a valid email address",
  minLength: (n) => `Must be at least ${n} characters`,
  maxLength: (n) => `Must be at most ${n} characters`,
  min: (n) => `Must be at least ${n}`,
  max: (n) => `Must be at most ${n}`,
  pattern: "Invalid format",
  fileSize: (mb) => `File must be smaller than ${mb} MB`,
  otpLength: (n) => `Enter the ${n}-digit code`,
  invalidDate: "Enter a valid date",
  showPassword: "Show password",
  hidePassword: "Hide password",
};

export function mergeMessages(overrides?: Partial<Messages>): Messages {
  return { ...defaultMessages, ...overrides };
}
