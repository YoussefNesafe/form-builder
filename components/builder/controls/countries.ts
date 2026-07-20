import { getCountries } from "libphonenumber-js";

export const COUNTRIES: { code: string; label: string }[] = (() => {
  let display: Intl.DisplayNames | undefined;
  try {
    display = new Intl.DisplayNames(["en"], { type: "region" });
  } catch {
    display = undefined;
  }
  return (getCountries() as string[])
    .map((code) => ({ code, label: display?.of(code) ?? code }))
    .sort((a, b) => a.label.localeCompare(b.label));
})();

const LABEL_BY_CODE = new Map(COUNTRIES.map((c) => [c.code, c.label]));

export function countryLabel(code: string): string {
  return LABEL_BY_CODE.get(code) ?? code;
}
