export type Messages = {
  required: string;
  email: string;
  minLength: (n: number) => string;
  maxLength: (n: number) => string;
  min: (limit: number | string) => string;
  max: (limit: number | string) => string;
  pattern: string;
  fileSize: (mb: number) => string;
  otpLength: (n: number) => string;
  invalidDate: string;
  invalidPhone: string;
  showPassword: string;
  hidePassword: string;
  next: string;
  back: string;
  submit: string;
  country: string;
  addRow: string;
  removeRow: (row: number) => string;
  removeFile: (name: string) => string;
  noOptions: string;
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
  invalidPhone: "Enter a valid phone number",
  showPassword: "Show password",
  hidePassword: "Hide password",
  next: "Next",
  back: "Back",
  submit: "Submit",
  country: "Country",
  addRow: "Add",
  removeRow: (row) => `Remove row ${row}`,
  removeFile: (name) => `Remove ${name}`,
  noOptions: "No options",
};

export function mergeMessages(overrides?: Partial<Messages>): Messages {
  return { ...defaultMessages, ...overrides };
}
