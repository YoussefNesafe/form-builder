import { create, type StateCreator } from "zustand";
import { createStore } from "zustand/vanilla";
import { persist, createJSONStorage } from "zustand/middleware";
import { fromConditionGroups, toConditionGroups, type ConditionSpec, type FieldType } from "@/form-builder";
import type { BuilderNode, BuilderState, BuilderStep, OutputMode } from "./types";
import { CONTAINER_TYPES, DEFAULT_PROPS } from "./defaults";
import { newId, syncCounterFromIds } from "./ids";

export type BuilderActions = {
  addNode: (type: FieldType, parentId?: string) => void;
  updateProps: (id: string, patch: Record<string, unknown>) => void;
  moveNode: (id: string, dir: -1 | 1) => void;
  duplicateNode: (id: string) => void;
  removeNode: (id: string) => void;
  selectNode: (id: string | null) => void;
  setMeta: (patch: { title?: string; description?: string }) => void;
  setOutputMode: (mode: OutputMode) => void;
  toggleMultiStep: (on: boolean) => void;
  setSteps: (steps: BuilderStep[]) => void;
  addStep: () => void;
  renameStep: (index: number, title: string) => void;
  removeStep: (index: number) => void;
  moveStep: (index: number, dir: -1 | 1) => void;
  /** Assign a node to a step (or `null` to unassign); removes it from every other step. */
  assignNodeToStep: (nodeId: string, stepIndex: number | null) => void;
  reset: () => void;
};

export type BuilderStore = BuilderState & BuilderActions;

const INITIAL: BuilderState = {
  title: "Untitled Form",
  description: "",
  nodes: [],
  multiStep: false,
  steps: [],
  selectedId: null,
  outputMode: "ts",
};

// ---- pure tree helpers (immutable) ----------------------------------------

/** Every `name` prop across the tree — used to keep generated names unique. */
function collectNames(nodes: BuilderNode[], into: Set<string> = new Set()): Set<string> {
  for (const node of nodes) {
    const name = node.props.name;
    if (typeof name === "string" && name) into.add(name);
    if (node.children) collectNames(node.children, into);
  }
  return into;
}

function uniqueName(base: string, taken: Set<string>): string {
  let i = 1;
  let candidate = `${base}${i}`;
  while (taken.has(candidate)) {
    i += 1;
    candidate = `${base}${i}`;
  }
  return candidate;
}

function makeNode(type: FieldType, taken: Set<string>): BuilderNode {
  const node: BuilderNode = {
    _id: newId(),
    type,
    props: { name: uniqueName(type, taken), ...structuredClone(DEFAULT_PROPS[type]) },
  };
  if (CONTAINER_TYPES.includes(type)) {
    taken.add(node.props.name as string);
    node.children = [makeNode("text", taken)];
  }
  return node;
}

/** Map every node in the tree (top-down), rebuilding arrays immutably. */
function mapTree(nodes: BuilderNode[], fn: (n: BuilderNode) => BuilderNode): BuilderNode[] {
  return nodes.map((node) => {
    const mapped = fn(node);
    return mapped.children ? { ...mapped, children: mapTree(mapped.children, fn) } : mapped;
  });
}

/** Rebuild the tree with `updater` applied to whichever array holds `id`. */
function updateSiblings(
  nodes: BuilderNode[],
  id: string,
  updater: (siblings: BuilderNode[]) => BuilderNode[],
): BuilderNode[] {
  if (nodes.some((n) => n._id === id)) return updater(nodes);
  return nodes.map((node) =>
    node.children ? { ...node, children: updateSiblings(node.children, id, updater) } : node,
  );
}

function findNode(nodes: BuilderNode[], id: string): BuilderNode | null {
  for (const node of nodes) {
    if (node._id === id) return node;
    if (node.children) {
      const found = findNode(node.children, id);
      if (found) return found;
    }
  }
  return null;
}

/** Deep-clone a subtree with fresh ids and names kept globally unique via `taken`. */
function cloneSubtree(node: BuilderNode, taken: Set<string>): BuilderNode {
  const name = uniqueName(node.type, taken);
  taken.add(name);
  const clone: BuilderNode = {
    _id: newId(),
    type: node.type,
    props: { ...structuredClone(node.props), name },
  };
  if (node.children) clone.children = node.children.map((child) => cloneSubtree(child, taken));
  return clone;
}

/** Clear any prop on `node` that references the deleted field `name` (same level only). */
function scrubRefs(node: BuilderNode, name: string): BuilderNode {
  const props = { ...node.props };
  let changed = false;
  for (const key of [
    "dependsOn",
    "enabledWhenVerified",
    "countryFrom",
    "copyFrom",
    "minDateField",
    "maxDateField",
    "minTimeField",
    "maxTimeField",
  ]) {
    if (props[key] === name) {
      delete props[key];
      changed = true;
    }
  }
  const rules = props.rules as { matches?: string; matchesMessage?: string } | undefined;
  if (rules && typeof rules === "object" && rules.matches === name) {
    const rest = { ...rules };
    delete rest.matches;
    delete rest.matchesMessage;
    if (Object.keys(rest).length) props.rules = rest;
    else delete props.rules;
    changed = true;
  }
  for (const key of ["visibleWhen", "disabledWhen", "enabledWhen"]) {
    const spec = props[key] as ConditionSpec | undefined;
    if (!spec || !toConditionGroups(spec).flat().some((c) => c.field === name)) continue;
    // Drop only the leaves referencing the deleted field; a group emptied
    // this way is dropped too (an empty AND-group would match everything).
    const groups = toConditionGroups(spec)
      .map((group) => group.filter((c) => c.field !== name))
      .filter((group) => group.length > 0);
    const next = fromConditionGroups(groups);
    if (next === undefined) delete props[key];
    else props[key] = next;
    changed = true;
  }
  return changed ? { ...node, props } : node;
}

/** Every `_id` in the tree — used to advance the id counter after rehydration. */
function collectIds(nodes: BuilderNode[], into: string[] = []): string[] {
  for (const node of nodes) {
    into.push(node._id);
    if (node.children) collectIds(node.children, into);
  }
  return into;
}

// ---- state creator ---------------------------------------------------------

const creator: StateCreator<BuilderStore> = (set, get) => ({
  ...INITIAL,

  addNode: (type, parentId) => {
    const taken = collectNames(get().nodes);
    const node = makeNode(type, taken);
    set((state) => {
      if (parentId) {
        return {
          nodes: mapTree(state.nodes, (n) =>
            n._id === parentId ? { ...n, children: [...(n.children ?? []), node] } : n,
          ),
          selectedId: node._id,
        };
      }
      return { nodes: [...state.nodes, node], selectedId: node._id };
    });
  },

  updateProps: (id, patch) =>
    set((state) => ({
      nodes: mapTree(state.nodes, (n) => (n._id === id ? { ...n, props: { ...n.props, ...patch } } : n)),
    })),

  moveNode: (id, dir) =>
    set((state) => ({
      nodes: updateSiblings(state.nodes, id, (siblings) => {
        const index = siblings.findIndex((n) => n._id === id);
        const target = index + dir;
        if (index < 0 || target < 0 || target >= siblings.length) return siblings;
        const next = [...siblings];
        [next[index], next[target]] = [next[target], next[index]];
        return next;
      }),
    })),

  duplicateNode: (id) => {
    const original = findNode(get().nodes, id);
    if (!original) return;
    const taken = collectNames(get().nodes);
    const clone = cloneSubtree(original, taken);
    set((state) => ({
      nodes: updateSiblings(state.nodes, id, (siblings) => {
        const index = siblings.findIndex((n) => n._id === id);
        const next = [...siblings];
        next.splice(index + 1, 0, clone);
        return next;
      }),
      selectedId: clone._id,
      // The clone inherits the original's step membership (top-level fields
      // only; group children are never in steps).
      steps: state.steps.map((step) =>
        step.nodeIds.includes(id) ? { ...step, nodeIds: [...step.nodeIds, clone._id] } : step,
      ),
    }));
  },

  removeNode: (id) => {
    const removed = findNode(get().nodes, id);
    const name = removed && typeof removed.props.name === "string" ? removed.props.name : null;
    const removedIds = new Set(removed ? collectIds([removed]) : [id]);
    set((state) => {
      const prune = (nodes: BuilderNode[]): BuilderNode[] => {
        const hadTarget = nodes.some((n) => n._id === id);
        let next = nodes
          .filter((n) => n._id !== id)
          .map((n) => (n.children ? { ...n, children: prune(n.children) } : n));
        // Scrub sibling references to the deleted field so the config stays valid.
        if (hadTarget && name) next = next.map((n) => scrubRefs(n, name));
        return next;
      };
      return {
        nodes: prune(state.nodes),
        // Clear selection if the selected node was anywhere in the removed subtree.
        selectedId: state.selectedId && removedIds.has(state.selectedId) ? null : state.selectedId,
        steps: state.steps.map((step) => ({
          ...step,
          nodeIds: step.nodeIds.filter((nid) => !removedIds.has(nid)),
        })),
      };
    });
  },

  selectNode: (id) => set({ selectedId: id }),
  setMeta: (patch) => set(patch),
  setOutputMode: (mode) => set({ outputMode: mode }),

  toggleMultiStep: (on) =>
    set((state) => {
      if (!on || state.steps.length > 0) return { multiStep: on };
      // Seed a first step containing every step-eligible top-level field
      // (hidden/submit render automatically and must not be assigned).
      const nodeIds = state.nodes
        .filter((n) => n.type !== "hidden" && n.type !== "submit")
        .map((n) => n._id);
      return { multiStep: on, steps: [{ title: "Step 1", nodeIds }] };
    }),

  setSteps: (steps) => set({ steps }),

  addStep: () =>
    set((state) => ({ steps: [...state.steps, { title: `Step ${state.steps.length + 1}`, nodeIds: [] }] })),

  renameStep: (index, title) =>
    set((state) => ({ steps: state.steps.map((s, i) => (i === index ? { ...s, title } : s)) })),

  removeStep: (index) => set((state) => ({ steps: state.steps.filter((_, i) => i !== index) })),

  moveStep: (index, dir) =>
    set((state) => {
      const target = index + dir;
      if (target < 0 || target >= state.steps.length) return {};
      const steps = [...state.steps];
      [steps[index], steps[target]] = [steps[target], steps[index]];
      return { steps };
    }),

  assignNodeToStep: (nodeId, stepIndex) =>
    set((state) => ({
      steps: state.steps.map((step, i) => {
        const without = step.nodeIds.filter((id) => id !== nodeId);
        return i === stepIndex ? { ...step, nodeIds: [...without, nodeId] } : { ...step, nodeIds: without };
      }),
    })),

  reset: () => set({ ...INITIAL }),
});

/** Fresh isolated store — used in tests. */
export const createBuilderStore = () => createStore<BuilderStore>()(creator);

const noopStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
};

/** App singleton, persisted to localStorage (selection is intentionally not persisted). */
export const useBuilderStore = create<BuilderStore>()(
  persist(creator, {
    name: "form-builder-draft",
    storage: createJSONStorage(() => (typeof window !== "undefined" ? window.localStorage : noopStorage)),
    partialize: (state) => ({
      title: state.title,
      description: state.description,
      nodes: state.nodes,
      multiStep: state.multiStep,
      steps: state.steps,
      outputMode: state.outputMode,
    }),
    // A fresh module starts the id counter at 0; advance it past every restored
    // id so newly-added nodes never collide with rehydrated ones.
    onRehydrateStorage: () => (state) => {
      if (state) syncCounterFromIds(collectIds(state.nodes));
    },
  }),
);
