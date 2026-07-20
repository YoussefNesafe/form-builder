import { BUILT_IN_FIELD_TYPES } from "@/form-builder";
import type { BuilderNode } from "./types";
import type { PropDescriptor } from "./fieldProps";

export type NodeContext = {
  node: BuilderNode;
  siblings: BuilderNode[];
  isNested: boolean;
};

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

export function eligibleRefs(
  siblings: BuilderNode[],
  refKind: PropDescriptor["refKind"] | "builtin" | "any",
  selfId: string,
): string[] {
  const self = siblings.find((n) => n._id === selfId);
  return siblings
    .filter((n) => n._id !== selfId)
    .filter((n) => typeof n.props.name === "string" && n.props.name)
    .filter((n) => {
      if (refKind === "otp") return n.type === "otp";
      if (refKind === "sameType") {
        return (
          !!self &&
          n.type === self.type &&
          (n.props.multiple === true) === (self.props.multiple === true) &&
          (n.props.range === true) === (self.props.range === true)
        );
      }
      if (refKind === "countrySource") {
        return (
          n.type === "country" ||
          (n.type === "select" && n.props.multiple !== true && n.props.optionsFrom === undefined)
        );
      }
      if (refKind === "optionsSource") {
        return n.type === "country" || (n.type === "select" && n.props.multiple !== true);
      }
      if (refKind === "textFamily") {
        return n.type === "text" || n.type === "email" || n.type === "password" || n.type === "textarea";
      }
      if (refKind === "dateSource") return n.type === "date" && n.props.range !== true;
      if (refKind === "timeSource") return n.type === "time";
      if (refKind === "builtin") {
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

const GROUP_FORBIDDEN_KEYS = new Set([
  "enabledWhenVerified",
  "dependsOn",
  "countryFrom",
  "copyFrom",
  "optionsFrom",
  "minDateField",
  "maxDateField",
  "minTimeField",
  "maxTimeField",
]);

export function visibleDescriptors(descriptors: PropDescriptor[], isNested: boolean): PropDescriptor[] {
  if (!isNested) return descriptors;
  return descriptors.filter((d) => !GROUP_FORBIDDEN_KEYS.has(d.key));
}
