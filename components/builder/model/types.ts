import type { ConditionSpec, FieldType } from "@/form-builder";

export type BuilderNode = {
  _id: string;
  type: FieldType;
  props: Record<string, unknown>;
  children?: BuilderNode[];
};

export type BuilderStep = {
  title: string;
  nodeIds: string[];
  visibleWhen?: ConditionSpec;
  review?: boolean;
};

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
