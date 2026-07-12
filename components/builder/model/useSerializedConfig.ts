"use client";

import { useMemo } from "react";
import type { FormConfig } from "@/form-builder";
import { validateFormConfig } from "@/form-builder/core/schema";
import { useBuilderStore } from "./store";
import { serialize } from "./serialize";

/**
 * Builder state → serialized `FormConfig` plus its validity, shared by the
 * PreviewPanel and CodeOutputPanel panes (same 5 store selectors + `serialize()` +
 * validate-on-change). Validation is skipped (`error: null`) while there are
 * no fields yet — each consumer decides what, if anything, to show for that
 * empty case (PreviewPanel shows an empty-state illustration; CodeOutputPanel shows its
 * own "Add at least one field." message).
 */
export function useSerializedConfig(): { config: FormConfig; error: string | null } {
  const title = useBuilderStore((s) => s.title);
  const description = useBuilderStore((s) => s.description);
  const nodes = useBuilderStore((s) => s.nodes);
  const multiStep = useBuilderStore((s) => s.multiStep);
  const steps = useBuilderStore((s) => s.steps);

  const config = useMemo(
    () => serialize({ title, description, nodes, multiStep, steps }),
    [title, description, nodes, multiStep, steps],
  );

  const error = useMemo<string | null>(() => {
    if (nodes.length === 0) return null;
    try {
      validateFormConfig(config);
      return null;
    } catch (e) {
      return e instanceof Error ? e.message : String(e);
    }
  }, [config, nodes.length]);

  return { config, error };
}
