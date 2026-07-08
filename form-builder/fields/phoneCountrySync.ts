import { AsYouType, getCountryCallingCode, type CountryCode } from "libphonenumber-js";

/**
 * Rewrite `value`'s calling-code prefix to `iso`'s country, preserving any
 * national digits already typed. Returns null when `iso` is not a country
 * libphonenumber knows (runtime guard — static configs are caught by
 * validateFormConfig).
 */
export function applyCountryToPhoneValue(value: string, iso: string): string | null {
  let callingCode: string;
  try {
    callingCode = getCountryCallingCode(iso as CountryCode);
  } catch {
    return null;
  }
  // AsYouType extracts the national part from partial input too; if the
  // calling code is still ambiguous, getNumber() is undefined and we fall
  // back to just the new prefix.
  const typer = new AsYouType();
  typer.input(value ?? "");
  const national = typer.getNumber()?.nationalNumber ?? "";
  return `+${callingCode}${national}`;
}
