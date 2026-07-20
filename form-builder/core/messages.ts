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
  sendCode: string;
  codeSent: string;
  resend: string;
  otpDidntReceive: string;
  resendIn: string;
  seconds: string;
  otpVerified: string;
  otpSendFailed: string;
  otpVerifyFailed: string;
  otpNotVerified: string;
  invalidDate: string;
  invalidTime: string;
  invalidPhone: string;
  invalidCountry: string;
  maskIncomplete: string;
  clearSignature: string;
  showPassword: string;
  hidePassword: string;
  passwordUppercase: string;
  passwordLowercase: string;
  passwordNumber: string;
  passwordSpecial: string;
  passwordMinLength: (n: number) => string;
  next: string;
  back: string;
  steps: string;
  submit: string;
  country: string;
  searchCountry: string;
  addRow: string;
  removeRow: (row: number) => string;
  removeFile: (name: string) => string;
  noOptions: string;
  ratingValue: (n: number, max: number) => string;
  invalidOption: string;
  edit: string;
  yes: string;
  no: string;
  notAnswered: string;
  signed: string;
  matches: (label: string) => string;
  dateAfter: (label: string) => string;
  dateBefore: (label: string) => string;
  timeAfter: (label: string) => string;
  timeBefore: (label: string) => string;
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
  sendCode: "Send OTP",
  codeSent: "Code Sent",
  resend: "Resend",
  otpDidntReceive: "Didn't receive OTP?",
  resendIn: "Resend in",
  seconds: "seconds",
  otpVerified: "Verified",
  otpSendFailed: "Could not send the code. Try again.",
  otpVerifyFailed: "Invalid OTP",
  otpNotVerified: "OTP is not verified",
  invalidDate: "Enter a valid date",
  invalidTime: "Enter a valid time",
  invalidPhone: "Enter a valid phone number",
  invalidCountry: "Select a valid country",
  maskIncomplete: "Incomplete value",
  clearSignature: "Clear",
  showPassword: "Show password",
  hidePassword: "Hide password",
  passwordUppercase: "1 Uppercase",
  passwordLowercase: "1 Lowercase",
  passwordNumber: "1 Number",
  passwordSpecial: "1 Special Char",
  passwordMinLength: (n) => `Min. ${n} char.`,
  next: "Next",
  back: "Back",
  steps: "Steps",
  submit: "Submit",
  country: "Country",
  searchCountry: "Search country...",
  addRow: "Add",
  removeRow: (row) => `Remove row ${row}`,
  removeFile: (name) => `Remove ${name}`,
  noOptions: "No options",
  ratingValue: (n, max) => `${n} of ${max}`,
  invalidOption: "Select a valid option",
  edit: "Edit",
  yes: "Yes",
  no: "No",
  notAnswered: "—",
  signed: "Signed",
  matches: (label) => `Must match ${label}`,
  dateAfter: (label) => `Must be on or after ${label}`,
  dateBefore: (label) => `Must be on or before ${label}`,
  timeAfter: (label) => `Must be at or after ${label}`,
  timeBefore: (label) => `Must be at or before ${label}`,
};

export function mergeMessages(overrides?: Partial<Messages>): Messages {
  return { ...defaultMessages, ...overrides };
}
