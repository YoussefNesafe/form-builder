import type { FieldType } from "@/form-builder";

/**
 * A field in the builder. `_id` is stable across edits; `name` lives in `props`
 * and may be empty or duplicated mid-edit — which is exactly why the builder
 * keys on `_id`, not `name`. `children` is populated for `group` nodes only.
 */
export type BuilderNode = {
  _id: string;
  type: FieldType;
  props: Record<string, unknown>;
  children?: BuilderNode[];
};

/** A wizard step referencing nodes by `_id` (resolved to `fieldNames` on export). */
export type BuilderStep = { title: string; nodeIds: string[] };

export type OutputMode = "ts" | "json";

export type BuilderState = {
  title: string;
  description: string;
  nodes: BuilderNode[];
  multiStep: boolean;
  steps: BuilderStep[];
  selectedId: string | null;
  outputMode: OutputMode;
};
