import type { FormConfig } from "@/form-builder";

/** Pretty JSON — valid for a CMS or a .json config file. */
export function toJson(config: FormConfig): string {
  return JSON.stringify(config, null, 2);
}

/**
 * A typed TS snippet ready to paste into a page. JSON is itself a valid TS
 * object literal, so the config body is emitted as pretty JSON with a typed
 * `const` and the import a host needs.
 */
export function toTs(config: FormConfig): string {
  return `import type { FormConfig } from "@/form-builder";

export const config: FormConfig = ${JSON.stringify(config, null, 2)};
`;
}

export function toCode(config: FormConfig, mode: "ts" | "json"): string {
  return mode === "ts" ? toTs(config) : toJson(config);
}
