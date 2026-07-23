import type { FormConfig } from "@/form-builder";

export function toJson(config: FormConfig): string {
  return JSON.stringify(config, null, 2);
}

export function toTs(config: FormConfig): string {
  return `import { defineForm, type InferValues } from "@/form-builder";

export const config = defineForm(${JSON.stringify(config, null, 2)});
export type Values = InferValues<typeof config>;
`;
}

export function toCode(config: FormConfig, mode: "ts" | "json"): string {
  return mode === "ts" ? toTs(config) : toJson(config);
}
