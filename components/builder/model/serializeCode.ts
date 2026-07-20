import type { FormConfig } from "@/form-builder";

export function toJson(config: FormConfig): string {
  return JSON.stringify(config, null, 2);
}

export function toTs(config: FormConfig): string {
  return `import type { FormConfig } from "@/form-builder";

export const config: FormConfig = ${JSON.stringify(config, null, 2)};
`;
}

export function toCode(config: FormConfig, mode: "ts" | "json"): string {
  return mode === "ts" ? toTs(config) : toJson(config);
}
