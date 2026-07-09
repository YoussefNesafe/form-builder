import type { PropDescriptor } from "../model/fieldProps";
import type { BuilderNode } from "../model/types";

export type ControlContext = {
  node: BuilderNode;
  siblings: BuilderNode[];
  isNested: boolean;
};

export type ControlProps<T = unknown> = {
  id: string;
  value: T;
  /** Pass `undefined` to clear the prop (pruned on serialize). */
  onChange: (value: T | undefined) => void;
  descriptor: PropDescriptor;
  ctx: ControlContext;
};
