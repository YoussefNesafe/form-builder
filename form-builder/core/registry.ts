import type { ComponentType } from "react";
import type { FieldConfig } from "./types";

export type FieldComponentProps = { field: FieldConfig };

const registry = new Map<string, ComponentType<FieldComponentProps>>();

export function registerField(type: string, component: ComponentType<FieldComponentProps>): void {
  registry.set(type, component);
}

export function getField(type: string): ComponentType<FieldComponentProps> | undefined {
  return registry.get(type);
}

export function getRegisteredTypes(): string[] {
  return [...registry.keys()];
}
