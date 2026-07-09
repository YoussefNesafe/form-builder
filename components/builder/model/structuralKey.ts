import type { BuilderNode, BuilderStep } from "./types";

// Props that, when changed, require the preview form to remount (they change
// field identity / form shape rather than a value). Everything else — labels,
// placeholders, validation rules — updates in place without losing form state.
function walk(nodes: BuilderNode[]): unknown[] {
  return nodes.map((n) => [
    n.type,
    n.props.name,
    // Value-cardinality props: toggling them changes the field's value shape
    // (string↔string[], single↔range), so RHF must re-initialize.
    n.props.multiple ?? false,
    n.props.range ?? false,
    n.children ? walk(n.children) : 0,
  ]);
}

/**
 * A key that changes only on STRUCTURAL edits (add/remove/reorder/rename/retype,
 * step assignment, multi-step toggle) — used to remount the preview form so RHF
 * re-initializes, while cosmetic edits re-render in place.
 */
export function structuralKey(nodes: BuilderNode[], steps: BuilderStep[], multiStep: boolean): string {
  return JSON.stringify({ fields: walk(nodes), steps: multiStep ? steps.map((s) => s.nodeIds) : null });
}
