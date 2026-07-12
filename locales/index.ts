import { en } from "./en";

export type Dictionary = typeof en;
const dictionaries = { en } as const;
export type Locale = keyof typeof dictionaries;

export function getDictionary(locale: Locale = "en"): Dictionary {
  return dictionaries[locale];
}

/** Single-locale direct access. Future locales go through getDictionary. */
export const t = en;

/** Interpolate {name} placeholders. Re-exported from ./fmt — see that file for why it's split out. */
export { fmt } from "./fmt";
