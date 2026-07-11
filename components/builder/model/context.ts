import { BUILT_IN_FIELD_TYPES } from "@/form-builder";
import type { BuilderNode } from "./types";
import type { PropDescriptor } from "./fieldProps";

export type NodeContext = {
  node: BuilderNode;
  /** The array that directly contains the node (top-level or a group's children). */
  siblings: BuilderNode[];
  /** True when the node lives inside a group. */
  isNested: boolean;
};

/** Locate a node plus the array it lives in and whether that array is nested in a group. */
export function findContext(nodes: BuilderNode[], id: string, nested = false): NodeContext | null {
  const node = nodes.find((n) => n._id === id);
  if (node) return { node, siblings: nodes, isNested: nested };
  for (const n of nodes) {
    if (n.children) {
      const found = findContext(n.children, id, true);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Named sibling field names eligible for a `fieldRef`/`condition` control,
 * mirroring the engine's validation rules:
 * - `otp`            → sibling otp fields
 * - `countrySource`  → sibling country fields or single-value selects
 * - `builtin`        → built-in siblings (isValid targets need a zod schema)
 * - `textFamily`     → text/email/password/textarea siblings (rules.matches)
 * - `dateSource`     → non-range date siblings (minDateField/maxDateField)
 * - `timeSource`     → time siblings (minTimeField/maxTimeField)
 * - `any`            → any named sibling
 * Self is always excluded.
 */
export function eligibleRefs(
  siblings: BuilderNode[],
  refKind: PropDescriptor["refKind"] | "builtin" | "any",
  selfId: string,
): string[] {
  return siblings
    .filter((n) => n._id !== selfId)
    .filter((n) => typeof n.props.name === "string" && n.props.name)
    .filter((n) => {
      if (refKind === "otp") return n.type === "otp";
      if (refKind === "countrySource") {
        return n.type === "country" || (n.type === "select" && n.props.multiple !== true);
      }
      if (refKind === "textFamily") {
        return n.type === "text" || n.type === "email" || n.type === "password" || n.type === "textarea";
      }
      if (refKind === "dateSource") return n.type === "date" && n.props.range !== true;
      if (refKind === "timeSource") return n.type === "time";
      if (refKind === "builtin") {
        // Mirrors the engine: static/submit/hidden are vacuously "valid"
        // (no user input), so they are not offered as isValid targets.
        return (
          (BUILT_IN_FIELD_TYPES as readonly string[]).includes(n.type) &&
          n.type !== "static" &&
          n.type !== "submit" &&
          n.type !== "hidden"
        );
      }
      return true;
    })
    .map((n) => n.props.name as string);
}

// Wiring props the engine hard-rejects inside groups — the editor hides these
// when the selected node is nested (validateFormConfig would otherwise throw).
// (rules.matches is handled inside RulesEditor via ctx.isNested.)
const GROUP_FORBIDDEN_KEYS = new Set([
  "enabledWhenVerified",
  "dependsOn",
  "countryFrom",
  "minDateField",
  "maxDateField",
  "minTimeField",
  "maxTimeField",
]);

/** Descriptors to render for a node, dropping group-forbidden wiring when nested. */
export function visibleDescriptors(descriptors: PropDescriptor[], isNested: boolean): PropDescriptor[] {
  if (!isNested) return descriptors;
  return descriptors.filter((d) => !GROUP_FORBIDDEN_KEYS.has(d.key));
}
