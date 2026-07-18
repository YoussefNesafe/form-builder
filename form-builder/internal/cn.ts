// Intentional duplicate of the app's `lib/utils.ts` `cn` helper, vendored so
// the copy-in package (`form-builder/`) is self-contained and has no import
// paths reaching outside itself. Do NOT DRY this back together with
// `@/lib/utils` — that would reintroduce the cross-package dependency this
// file exists to remove.
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
