import type { BuilderNode, BuilderStep } from "./types";

function walk(nodes: BuilderNode[]): unknown[] {
  return nodes.map((n) => [
    n.type,
    n.props.name,
    n.props.multiple ?? false,
    n.props.range ?? false,
    n.children ? walk(n.children) : 0,
  ]);
}

export function structuralKey(nodes: BuilderNode[], steps: BuilderStep[], multiStep: boolean): string {
  return JSON.stringify({ fields: walk(nodes), steps: multiStep ? steps.map((s) => s.nodeIds) : null });
}
