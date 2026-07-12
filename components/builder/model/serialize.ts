import type { AnyFieldConfig, FormConfig, StepConfig } from "@/form-builder";
import { pruneEmpty } from "../controls/clean";
import type { BuilderNode, BuilderState } from "./types";

/** URL-safe slug: lowercase, punctuation stripped, spaces → single hyphens. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Prune builder noise from a prop bag before it becomes a field config: drop
 * `undefined`/`null`, empty strings, and explicit `false` (all equivalent to
 * "absent" in the engine). `value` is exempt — a hidden field must keep its
 * key even when the value is an empty string or `false`.
 */
function cleanProps(props: Record<string, unknown>): Record<string, unknown> {
  return pruneEmpty(props, (key) => key === "value");
}

function serializeNode(node: BuilderNode): AnyFieldConfig {
  const field = { type: node.type, ...cleanProps(node.props) } as Record<string, unknown>;
  if (node.type === "group") {
    field.fields = (node.children ?? []).map(serializeNode);
  }
  return field as AnyFieldConfig;
}

type SerializeInput = Pick<BuilderState, "title" | "description" | "nodes" | "multiStep" | "steps">;

/** Pure builder-state → FormConfig. Single source for preview and code output. */
export function serialize(state: SerializeInput): FormConfig {
  const config: FormConfig = {
    id: slugify(state.title) || "untitled-form",
    fields: state.nodes.map(serializeNode),
  };
  if (state.title.trim()) config.title = state.title;
  if (state.description.trim()) config.description = state.description;

  if (state.multiStep && state.steps.length > 0) {
    const nameById = new Map<string, string>();
    for (const node of state.nodes) {
      const name = node.props.name;
      if (typeof name === "string" && name) nameById.set(node._id, name);
    }
    const steps = state.steps
      .map((step): StepConfig => {
        const fieldNames = step.nodeIds.map((id) => nameById.get(id)).filter((n): n is string => Boolean(n));
        return {
          title: step.title,
          // Review steps carry review: true INSTEAD of fieldNames (engine
          // enforces exactly-one); regular steps carry fieldNames.
          ...(step.review ? { review: true as const } : { fieldNames }),
          ...(step.visibleWhen !== undefined ? { visibleWhen: step.visibleWhen } : {}),
        };
      })
      // The engine rejects a regular step with no field names; an all-removed
      // step would otherwise brick the whole config.
      .filter((step) => step.review === true || (step.fieldNames?.length ?? 0) > 0);
    if (steps.length > 0) config.steps = steps;
  }

  return config;
}
