import { en } from "./en";

export type Dictionary = typeof en;
const dictionaries = { en } as const;
export type Locale = keyof typeof dictionaries;

export function getDictionary(locale: Locale = "en"): Dictionary {
  return dictionaries[locale];
}

export const t = en;

export { fmt } from "./fmt";
